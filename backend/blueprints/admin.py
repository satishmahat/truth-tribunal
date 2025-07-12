from flask import Blueprint, request, jsonify
from extensions import db
from models import User
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import random
import string
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

def admin_required(fn):
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        print("CLAIMS:", claims)
        if claims.get('role') != 'admin':
            return jsonify({'msg': 'Admins only'}), 403
        return fn(*args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper

def generate_license_key():
    """Generate license key in format YEAR-XXXX"""
    current_year = datetime.now().year
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{current_year}-{random_part}"

@admin_bp.route('/requests', methods=['GET'])
@admin_required
def get_pending_reporters():
    pending = User.query.filter_by(role='reporter', is_approved=False).all()
    return jsonify([{
        'id': u.id, 
        'name': u.name, 
        'email': u.email,
        'phone_number': u.phone_number,
        'citizenship_number': u.citizenship_number,
        'profile_photo_url': u.profile_photo_url,
        'reporter_id_card_url': u.reporter_id_card_url,
        'created_at': u.created_at.isoformat() if u.created_at else None
    } for u in pending])

@admin_bp.route('/user/<int:user_id>', methods=['GET'])
@admin_required
def get_user_details(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    if user.role != 'reporter':
        return jsonify({'msg': 'User is not a reporter'}), 400
    
    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'phone_number': user.phone_number,
        'citizenship_number': user.citizenship_number,
        'profile_photo_url': user.profile_photo_url,
        'reporter_id_card_url': user.reporter_id_card_url,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'is_approved': user.is_approved
    })

@admin_bp.route('/approve', methods=['POST'])
@admin_required
def approve_reporter():
    data = request.json
    if not data or 'user_id' not in data:
        return jsonify({'msg': 'user_id is required'}), 400
    
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    
    # Generate license key
    license_key = generate_license_key()
    
    user.is_approved = True
    user.license_key = license_key
    db.session.commit()
    # TODO: Send email with license_key
    return jsonify({'msg': 'Reporter approved', 'license_key': license_key})

@admin_bp.route('/reporters', methods=['GET'])
@jwt_required()
def get_reporters():
    reporters = User.query.filter_by(role='reporter', is_approved=True).all()
    return jsonify([
        {
            'id': r.id,
            'name': r.name,
            'email': r.email,
            'license': r.license_key,
            'created_at': r.created_at.isoformat() if r.created_at else None
        }
        for r in reporters
    ])

@admin_bp.route('/revoke', methods=['POST'])
@jwt_required()
def revoke_reporter():
    data = request.json
    if not data or 'user_id' not in data:
        return jsonify({'msg': 'user_id is required'}), 400
    
    user = User.query.get(data['user_id'])
    if not user or user.role != 'reporter':
        return jsonify({'msg': 'User not found or not a reporter'}), 404
    user.is_approved = False
    user.license_key = None  # Optionally clear the license
    db.session.commit()
    return jsonify({'msg': 'Reporter revoked'}) 