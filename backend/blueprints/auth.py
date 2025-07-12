from flask import Blueprint, request, jsonify
from extensions import db
from models import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    if not all(k in data for k in ('name', 'email', 'password', 'phone_number', 'citizenship_number', 'profile_photo_url', 'reporter_id_card_url')):
        return jsonify({'msg': 'Missing fields'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'msg': 'Email already registered'}), 400
    user = User(
        name=data['name'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role='reporter',
        phone_number=data['phone_number'],
        citizenship_number=data['citizenship_number'],
        profile_photo_url=data['profile_photo_url'],
        reporter_id_card_url=data['reporter_id_card_url']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'msg': 'Registration submitted, pending approval'}), 201

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