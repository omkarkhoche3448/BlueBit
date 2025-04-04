from flask import request, jsonify
from flask_cors import CORS  # Import flask_cors
import logging
from datetime import datetime, timedelta
from config import Session, razorpay_client, RAZORPAY_KEY_ID
from models import User


def register_payment_routes(app):
    
    CORS(app, resources={r"*": {"origins": "*"}})
    
    @app.route('/api/payment', methods=['POST'])
    def create_payment():
        try:
            data = request.json
            clerk_id = data.get('clerkId')
            amount = 100  # ₹100.00 in smallest currency unit
            
            if not clerk_id:
                return jsonify({'error': 'User ID is required'}), 400
                
            # Create Razorpay order
            payment_data = {
                'amount': amount,
                'currency': 'INR',
                'receipt': f'pro_sub_{clerk_id}',
                'payment_capture': 1,
                'notes': {
                    'clerk_id': clerk_id,
                    'plan': 'pro_subscription'
                }
            }
            
            order = razorpay_client.order.create(payment_data)
            
            return jsonify({
                'order_id': order['id'],
                'amount': order['amount'],
                'currency': order['currency'],
                'key': RAZORPAY_KEY_ID
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
            payment_id = data.get('paymentId')
            order_id = data.get('orderId')
            signature = data.get('signature')
            
            if not all([clerk_id, payment_id, order_id, signature]):
                return jsonify({'error': 'Missing required parameters'}), 400
            
            # Verify payment signature
            try:
                razorpay_client.utility.verify_payment_signature({
                    'razorpay_order_id': order_id,
                    'razorpay_payment_id': payment_id,
                    'razorpay_signature': signature
                })
            except Exception as e:
                logging.error(f"Signature verification failed: {str(e)}")
                return jsonify({'error': 'Payment signature verification failed'}), 400
            
            # Fetch payment details
            payment = razorpay_client.payment.fetch(payment_id)
            
            if payment['status'] == 'captured':
                # Update user to pro
                user = session.query(User).filter(User.clerk_id == clerk_id).first()
                print('inside payment')
                
                if user:
                    print('inside user', user.is_pro)
                    user.is_pro = True
                    user.pro_expiration_date  = datetime.now() + timedelta(days=30)  # Set expiration date to 30 days from now
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