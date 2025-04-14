from flask import request, jsonify
from flask_cors import CORS  # Import flask_cors
import logging
from datetime import datetime, timedelta
from config import Session, create_cashfree_order, verify_cashfree_order, CASHFREE_APP_ID, ALLOWED_ORIGINS
from models import User
import uuid

def register_payment_routes(app):
    # Restrict CORS to allowed origins
    CORS(app, resources={r"*": {"origins": ALLOWED_ORIGINS}})
    
    @app.route('/api/payment', methods=['POST'])
    def create_payment():
        try:
            data = request.json
            clerk_id = data.get('clerkId')
            amount = 1  # ₹1.00 in INR for testing (change to 149 for production)
            customer_phone = data.get('phone', '')
            customer_email = data.get('email', 'user@example.com')
            customer_name = data.get('name', '')
            
            if not clerk_id:
                return jsonify({'error': 'User ID is required'}), 400
                
            if not customer_phone:
                return jsonify({'error': 'Phone number is required'}), 400
                
            # Create a unique order ID
            order_id = f"order_{uuid.uuid4().hex[:10]}"
                
            # Create Cashfree order - following exact format from Cashfree docs
            payment_data = {
                "order_id": order_id,
                "order_amount": str(amount),  # Convert to string as required by Cashfree
                "order_currency": "INR",
                "customer_details": {
                    "customer_id": clerk_id,
                    "customer_name": customer_name,
                    "customer_email": customer_email,
                    "customer_phone": customer_phone
                },
                "order_meta": {
                    "return_url": f"https://handjobs.co.in/payment-success?order_id={order_id}&customer_id={clerk_id}",
                    "notify_url": "https://handjobs.co.in/api/payment/webhook"  # Optional but recommended
                }
            }
            
            logging.info(f"Creating Cashfree order with data: {payment_data}")
            
            # Create the order using our helper function
            order = create_cashfree_order(payment_data)
            logging.info(f"Cashfree order response: {order}")
            
            return jsonify({
                'order_id': order.get('order_id', ''),
                'payment_session_id': order.get('payment_session_id', ''),
                'cf_order_id': order.get('cf_order_id', ''),
                'order_status': order.get('order_status', '')
            })
            
        except Exception as e:
            logging.error(f"Error creating payment: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/payment/success', methods=['POST'])
    def payment_success():
        session = Session()
        try:
            data = request.json
            clerk_id = data.get('clerkId')
            order_id = data.get('orderId')
            
            if not all([clerk_id, order_id]):
                return jsonify({'error': 'Missing required parameters'}), 400
            
            # Verify payment status using our helper function
            order_data = verify_cashfree_order(order_id)
            
            if order_data['order_status'] == 'PAID':
                # Update user to pro
                user = session.query(User).filter(User.clerk_id == clerk_id).first()
                print('inside payment')
                
                if user:
                    print('inside user', user.is_pro)
                    user.is_pro = True
                    user.pro_expiration_date = datetime.now() + timedelta(days=30)  # Set expiration date to 30 days from now
                    session.commit()
                    print('inside commit', user.is_pro)
                    
                    logging.info(f"User {clerk_id} upgraded to pro successfully")
                    return jsonify({
                        'message': 'Payment successful, pro status activated',
                        'is_pro': True
                    })
                else:
                    return jsonify({'error': 'User not found'}), 404
            else:
                logging.warning(f"Payment not captured for user {clerk_id}")
                return jsonify({'error': 'Payment not captured'}), 400
                
        except Exception as e:
            session.rollback()
            logging.error(f"Error processing payment success: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()