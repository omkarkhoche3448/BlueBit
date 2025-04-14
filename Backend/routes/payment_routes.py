from flask import request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime, timedelta
import requests
from config import Session, ALLOWED_ORIGINS, CASHFREE_CLIENT_ID, CASHFREE_CLIENT_SECRET
from models import User


def register_payment_routes(app):
    # Restrict CORS to allowed origins
    CORS(app, resources={r"*": {"origins": ALLOWED_ORIGINS}})
    
    # Cashfree API URLs - use sandbox for testing, change to production when going live
    CASHFREE_BASE_URL = "https://api.cashfree.com/pg"
    CASHFREE_CREATE_ORDER_URL = f"{CASHFREE_BASE_URL}/orders"
    CASHFREE_GET_ORDER_URL = f"{CASHFREE_BASE_URL}/orders" # Will append order_id when needed
    
    @app.route('/api/payment', methods=['POST'])
    def create_payment():
        try:
            data = request.json
            clerk_id = data.get('clerkId')
            amount = 149.00  # ₹149.00
            
            if not clerk_id:
                return jsonify({'error': 'User ID is required'}), 400
                
            # Create order reference id
            order_id = f"pro_sub_{clerk_id}_{int(datetime.now().timestamp())}"
            
            # Prepare request data for Cashfree order creation
            headers = {
                "x-client-id": CASHFREE_CLIENT_ID,
                "x-client-secret": CASHFREE_CLIENT_SECRET,
                "x-api-version": "2023-08-01",
                "Content-Type": "application/json"
            }
            
            # Create order payload
            order_payload = {
                "order_id": order_id,
                "order_amount": amount,
                "order_currency": "INR",
                "customer_details": {
                    "customer_id": clerk_id,
                    "customer_phone": "9999999999"  # You might want to collect this from user
                },
                "order_meta": {
                    "return_url": f"{request.host_url.rstrip('/')}/api/payment/return?order_id={order_id}"
                },
                "order_note": "Pro subscription payment"
            }
            
            # Call Cashfree API to create order
            response = requests.post(
                CASHFREE_CREATE_ORDER_URL,
                json=order_payload,
                headers=headers
            )
            
            if response.status_code != 200:
                logging.error(f"Cashfree order creation failed: {response.text}")
                return jsonify({'error': 'Payment gateway error'}), 500
            
            # Extract payment session id from response
            order_response = response.json()
            
            return jsonify({
                'order_id': order_response.get('order_id'),
                'payment_session_id': order_response.get('payment_session_id'),
                'amount': amount,
                'currency': 'INR'
            })
            
        except Exception as e:
            logging.error(f"Error creating payment: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/payment/return', methods=['GET'])
    def payment_return():
        # This route handles the return URL after payment
        # You should redirect from here to your frontend with appropriate status
        order_id = request.args.get('order_id')
        
        # Redirect to frontend with order ID
        # Return a simple response or redirect to your frontend
        return f"<script>window.location.href = '/payment-status?order_id={order_id}';</script>"

    @app.route('/api/payment/verify', methods=['POST'])
    def verify_payment():
        session = Session()
        try:
            data = request.json
            order_id = data.get('orderId')
            clerk_id = data.get('clerkId')
            
            if not order_id or not clerk_id:
                return jsonify({'error': 'Missing required parameters'}), 400
            
            # Prepare headers for Cashfree API
            headers = {
                "x-client-id": CASHFREE_CLIENT_ID,
                "x-client-secret": CASHFREE_CLIENT_SECRET,
                "x-api-version": "2023-08-01",
                "Content-Type": "application/json"
            }
            
            # Verify order status with Cashfree
            response = requests.get(
                f"{CASHFREE_GET_ORDER_URL}/{order_id}",
                headers=headers
            )
            
            if response.status_code != 200:
                logging.error(f"Cashfree order verification failed: {response.text}")
                return jsonify({'error': 'Payment verification failed'}), 400
            
            order_details = response.json()
            
            # Check if payment is successful
            if order_details.get('order_status') == 'PAID':
                # Update user to pro
                user = session.query(User).filter(User.clerk_id == clerk_id).first()
                
                if user:
                    user.is_pro = True
                    user.pro_expiration_date = datetime.now() + timedelta(days=30)
                    session.commit()
                    
                    logging.info(f"User {clerk_id} upgraded to pro successfully")
                    return jsonify({
                        'message': 'Payment successful, pro status activated',
                        'is_pro': True
                    })
                else:
                    return jsonify({'error': 'User not found'}), 404
            else:
                logging.warning(f"Payment not completed for order {order_id}")
                return jsonify({
                    'error': 'Payment not completed',
                    'status': order_details.get('order_status')
                }), 400
                
        except Exception as e:
            session.rollback()
            logging.error(f"Error verifying payment: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()