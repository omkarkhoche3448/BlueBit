from flask import request, jsonify
from flask_cors import CORS  # Import flask_cors
import logging
from datetime import datetime, timedelta
from config import Session, create_cashfree_order, verify_cashfree_order, CASHFREE_APP_ID, ALLOWED_ORIGINS
from models import User
from utils.jwt_middleware import jwt_required, get_current_user
import uuid

def register_payment_routes(app):
    # Restrict CORS to allowed origins
    CORS(app, resources={r"*": {"origins": ALLOWED_ORIGINS}})
    
    @app.route('/api/payment', methods=['POST'])
    @jwt_required
    def create_payment(user_id):
        session = Session()
        try:
            # Get user details from database using JWT user_id
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            data = request.json or {}
            amount = 1  # ₹1.00 in INR for testing (change to 149 for production)
            
            # Use user data from JWT token and database, fallback to request data
            customer_phone = data.get('phone', getattr(user, 'phone', ''))
            customer_email = data.get('email', user.email)
            customer_name = data.get('name', user.username)
            
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
                    "customer_id": str(user_id),
                    "customer_name": customer_name,
                    "customer_email": customer_email,
                    "customer_phone": customer_phone
                },
                "order_meta": {
                    "return_url": f"https://handjobs.co.in/payment-success?order_id={order_id}&user_id={user_id}",
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
        finally:
            session.close()

    @app.route('/api/payment/success', methods=['POST'])
    @jwt_required
    def payment_success(user_id):
        session = Session()
        try:
            data = request.json
            order_id = data.get('orderId')
            
            if not order_id:
                return jsonify({'error': 'Missing required parameters'}), 400
            
            # Verify payment status using our helper function
            order_data = verify_cashfree_order(order_id)
            
            if order_data.get('order_status') == 'PAID':
                # Verify that the customer_id in the order matches the JWT user_id for security
                order_customer_id = order_data.get('customer_details', {}).get('customer_id')
                if order_customer_id != str(user_id):
                    logging.warning(f"Security: User {user_id} trying to access order for customer {order_customer_id}")
                    return jsonify({'error': 'Unauthorized access to payment'}), 403
                
                # Update user to pro
                user = session.query(User).filter(User.id == user_id).first()
                
                if user:
                    user.is_pro = True
                    user.pro_expiration_date = datetime.now() + timedelta(days=30)  # Set expiration date to 30 days from now
                    session.commit()
                    
                    logging.info(f"User {user_id} upgraded to pro successfully")
                    return jsonify({
                        'message': 'Payment successful, pro status activated',
                        'is_pro': True
                    })
                else:
                    return jsonify({'error': 'User not found'}), 404
            else:
                logging.warning(f"Payment not captured for user {user_id}, order status: {order_data.get('order_status')}")
                return jsonify({'error': 'Payment not captured'}), 400
                
        except Exception as e:
            session.rollback()
            logging.error(f"Error processing payment success: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/payment/webhook', methods=['POST'])
    def payment_webhook():
        """Handle Cashfree webhook notifications"""
        session = Session()
        try:
            data = request.json
            logging.info(f"Received webhook data: {data}")
            
            # Extract relevant data from webhook
            order_id = data.get('order', {}).get('order_id')
            order_status = data.get('order', {}).get('order_status')
            customer_id = data.get('order', {}).get('customer_details', {}).get('customer_id')
            
            if not all([order_id, order_status, customer_id]):
                logging.warning("Missing required webhook data")
                return jsonify({'status': 'error', 'message': 'Missing required data'}), 400
            
            # If payment is successful, update user to pro
            if order_status == 'PAID':
                user = session.query(User).filter(User.id == customer_id).first()
                
                if user:
                    user.is_pro = True
                    user.pro_expiration_date = datetime.now() + timedelta(days=30)
                    session.commit()
                    
                    logging.info(f"Webhook: User {customer_id} upgraded to pro successfully")
                else:
                    logging.warning(f"Webhook: User {customer_id} not found")
            
            return jsonify({'status': 'success'}), 200
            
        except Exception as e:
            session.rollback()
            logging.error(f"Error processing webhook: {str(e)}")
            return jsonify({'status': 'error', 'message': str(e)}), 500
        finally:
            session.close()

    @app.route('/api/payment/status', methods=['GET'])
    @jwt_required
    def get_payment_status(user_id):
        """Get current user's pro status and payment information"""
        session = Session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Check if pro status is expired
            is_pro_active = user.is_pro
            if user.is_pro and user.pro_expiration_date:
                is_pro_active = datetime.now() < user.pro_expiration_date
                if not is_pro_active and user.is_pro:
                    # Auto-expire the pro status
                    user.is_pro = False
                    session.commit()
                    logging.info(f"User {user_id} pro status expired and set to False")
            
            return jsonify({
                'is_pro': is_pro_active,
                'pro_expiration_date': user.pro_expiration_date.isoformat() if user.pro_expiration_date else None,
                'user_id': user.id,
                'username': user.username
            })
            
        except Exception as e:
            logging.error(f"Error getting payment status: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            session.close()