from flask import Blueprint, request, jsonify
from extensions import db
from models import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
import re

auth_bp = Blueprint('auth', __name__)

def validate_registration_data(data):
    """
    Simple validation for registration data
    """
    errors = []
    
    # Full Name validation - must have at least 2 words with 2+ characters each
    if not data.get('name') or not data['name'].strip():
        errors.append('Full name is required')
    else:
        name = data['name'].strip()
        words = name.split()
        if len(words) < 2:
            errors.append('Full name must contain at least 2 words')
        elif any(len(word) < 2 for word in words):
            errors.append('Each word in the name must be at least 2 characters long')
        elif not re.match(r'^[a-zA-Z\s]+$', name):
            errors.append('Full name can only contain letters and spaces')
    
    # Email validation with regex
    if not data.get('email') or not data['email'].strip():
        errors.append('Email is required')
    elif not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data['email'].strip()):
        errors.append('Please enter a valid email address')
    
    # Password validation with regex
    if not data.get('password'):
        errors.append('Password is required')
    elif len(data['password']) < 8:
        errors.append('Password must be at least 8 characters long')
    elif not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)', data['password']):
        errors.append('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    
    # Phone number validation (Nepali format: accepts 98XXXXXXXXXX, 97XXXXXXXXXX, +977-98XXXXXXXXXX, +977-97XXXXXXXXXX, 97798XXXXXXXXXX, 97797XXXXXXXXXX)
    # Also handles spaces in phone numbers for user convenience
    if not data.get('phone_number') or not data['phone_number'].strip():
        errors.append('Phone number is required')
    else:
        # Remove all spaces from phone number for validation
        phone_clean = data['phone_number'].strip().replace(' ', '')
        if not re.match(r'^(\+977-|977)?[9][87][0-9]{8}$', phone_clean):
            errors.append('Phone number must be 10 digits starting with 98 or 97, or use format +977-98XXXXXXXX or 97798XXXXXXXX')
        # Store the cleaned version without spaces
        data['phone_number'] = phone_clean
    
    # No validation for citizenship number - removed as requested
    
    return len(errors) == 0, errors

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    
    # Check if all required fields are present
    required_fields = ['name', 'email', 'password', 'phone_number', 'citizenship_number', 'profile_photo_url', 'reporter_id_card_url']
    missing_fields = [field for field in required_fields if not data.get(field)]
    
    if missing_fields:
        return jsonify({'msg': f'Missing required fields: {", ".join(missing_fields)}'}), 400
    
    # Validate data
    is_valid, validation_errors = validate_registration_data(data)
    if not is_valid:
        return jsonify({'msg': 'Validation failed', 'errors': validation_errors}), 400
    
    # Check if email already exists
    if User.query.filter_by(email=data['email'].strip().lower()).first():
        return jsonify({'msg': 'Email already registered'}), 400
    
    # Check if phone number already exists (use cleaned version)
    if User.query.filter_by(phone_number=data['phone_number']).first():
        return jsonify({'msg': 'Phone number already registered'}), 400
    
    # Check if citizenship number already exists
    if User.query.filter_by(citizenship_number=data['citizenship_number'].strip()).first():
        return jsonify({'msg': 'Citizenship number already registered'}), 400
    
    try:
        user = User(
            name=data['name'].strip(),
            email=data['email'].strip().lower(),
            password_hash=generate_password_hash(data['password']),
            role='reporter',
            phone_number=data['phone_number'],  # Already cleaned in validation
            citizenship_number=data['citizenship_number'].strip(),
            profile_photo_url=data['profile_photo_url'],
            reporter_id_card_url=data['reporter_id_card_url']
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({'msg': 'Registration submitted, pending approval'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Registration failed. Please try again.'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    if 'email' not in data or 'password' not in data:
        return jsonify({'msg': 'Missing email or password'}), 400
    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'msg': 'Invalid credentials'}), 401
    if not user.is_approved:
        return jsonify({'msg': 'Not approved yet'}), 403
    if user.role == 'reporter' and user.license_key != data.get('license_key', None):
        return jsonify({'msg': 'Invalid license key'}), 401
    access_token = create_access_token(identity=str(user.id), additional_claims={'role': user.role})
    return jsonify({
        'access_token': access_token,
        'role': user.role,
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'phone_number': user.phone_number,
        'profile_photo_url': user.profile_photo_url,
        # add more fields if needed
    }) 