import re
import os
from flask import Blueprint, request, jsonify, abort
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from app import db
from app.models import User, Profile, AdminActionLog
from app.utils import (
    hash_password,
    check_password,
    generate_verification_token,
    verify_token,
    send_verification_email,
    role_required,
    Config,
    normalize_phone,
)

auth_bp = Blueprint('auth', __name__)

# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------
EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
USERNAME_RE = re.compile(r'^[A-Za-z0-9_]{3,80}$')
VALID_PROFILE_TYPES = {'GROOM', 'BRIDE'}


def _validate_registration(data: dict) -> tuple:
    """Validate registration payload.  Returns (is_valid: bool, message: str)."""
    phone = normalize_phone(data.get('phone', ''))
    password = data.get('password', '')
    profile_type = data.get('profile_type', '').upper()

    if not phone or len(phone) < 10:
        return False, 'A valid 10-digit mobile number is required.'
    if len(password) < 6:
        return False, 'Password must be at least 6 characters long.'
    if profile_type not in VALID_PROFILE_TYPES:
        return False, f'profile_type must be one of: {", ".join(VALID_PROFILE_TYPES)}'
    return True, 'OK'


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------
@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new USER (GROOM or BRIDE). Creates an account and profile details."""
    data = request.get_json(silent=True) or {}

    valid, msg = _validate_registration(data)
    if not valid:
        return jsonify(error='Validation Error', message=msg), 400

    phone = normalize_phone(data['phone'])
    username = data.get('username', '').strip()  # stores full name
    password = data['password']
    profile_type = data['profile_type'].upper()
    bio = data.get('bio', '').strip()
    
    gotra_self = data.get('gotra_self', '').strip()
    gotra_mother = data.get('gotra_mother', '').strip()
    dob = data.get('dob', '').strip()
    district = data.get('district', '').strip()
    education = data.get('education', '').strip()
    profession = data.get('profession', '').strip()
    photo_base64 = data.get('photo_base64', '')

    # Uniqueness checks
    if User.query.filter_by(phone=phone).first():
        return jsonify(error='Conflict', message='Mobile number is already registered.'), 409

    try:
        user = User(
            phone=phone,
            username=username,
            password_hash=hash_password(password),
            role='USER',
            is_approved=False,
            email_verified=True,
        )
        db.session.add(user)
        db.session.flush()  # get user.id before committing

        profile = Profile(
            user_id=user.id,
            type=profile_type,
            bio=bio,
            visible=False,
            approval_status='SENT',
            dob=dob,
            height=data.get('height', "5'10\""),
            gotra_self=gotra_self,
            gotra_mother=gotra_mother,
            education=education,
            profession=profession,
            district=district,
            community=data.get('community', 'Mewada'),
            contact=phone,
        )

        # Handle profile picture upload base64
        if photo_base64:
            import base64
            import secrets
            if "," in photo_base64:
                photo_base64 = photo_base64.split(",")[1]
            img_data = base64.b64decode(photo_base64)
            
            ext = 'jpg'
            filename = f"upload_{secrets.token_hex(8)}.{ext}"
            
            upload_path = Config.UPLOAD_FOLDER
            os.makedirs(upload_path, exist_ok=True)
            
            filepath = os.path.join(upload_path, filename)
            with open(filepath, 'wb') as f:
                f.write(img_data)
            
            profile.image_path = filename

        db.session.add(profile)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] register: {e}")
        return jsonify(error='Server Error', message='Registration failed. Please try again.'), 500

    return jsonify(
        message='Registration successful! You may now login.',
        phone=user.phone,
        username=user.username
    ), 201


# ---------------------------------------------------------------------------
# GET /auth/verify-email?token=<token>
# ---------------------------------------------------------------------------
@auth_bp.route('/verify-email', methods=['GET'])
def verify_email():
    """Consume the email-verification token and mark the user's email as verified."""
    token = request.args.get('token', '').strip()
    if not token:
        return jsonify(error='Bad Request', message='Verification token is required.'), 400

    email = verify_token(token)
    if email is None:
        return jsonify(error='Invalid Token', message='The verification link is invalid or has expired.'), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify(error='Not Found', message='No user found for this email.'), 404

    if user.email_verified:
        return jsonify(message='Email already verified. You can log in.'), 200

    user.email_verified = True
    db.session.commit()
    return jsonify(message='Email verified successfully! You may now log in.'), 200


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------
@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate a user and return JWT access + refresh tokens."""
    data = request.get_json(silent=True) or {}
    phone_or_username = data.get('phone') or data.get('username')
    phone_or_username = str(phone_or_username).strip() if phone_or_username else ''
    password = data.get('password', '')

    if not phone_or_username or not password:
        return jsonify(error='Bad Request', message='phone or username and password are required.'), 400

    # Match by phone first, then username
    normalized_phone = normalize_phone(phone_or_username)
    user = None
    if normalized_phone:
        user = User.query.filter_by(phone=normalized_phone).first()
    if not user:
        user = User.query.filter_by(username=phone_or_username).first()

    if not user or not check_password(password, user.password_hash):
        return jsonify(error='Unauthorized', message='Invalid mobile number or password.'), 401

    additional_claims = {'role': user.role}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        username=user.username,
    ), 200


# ---------------------------------------------------------------------------
# POST /auth/refresh
# ---------------------------------------------------------------------------
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Issue a new access token using a valid refresh token."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify(error='Unauthorized', message='User not found.'), 401

    additional_claims = {'role': user.role}
    new_access = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    return jsonify(access_token=new_access), 200
