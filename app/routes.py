import os
from flask import Blueprint, request, jsonify, abort, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import User, Profile, AdminActionLog
from app.utils import (
    allowed_file,
    sanitize_filename,
    validate_image_file,
    hash_password,
    role_required,
    Config,
    normalize_phone,
)

api_bp = Blueprint('api', __name__)

# Allowed role constants (plain strings matching models.py)
ROLE_ADMIN = 'ADMIN'
ROLE_SUPER_ADMIN = 'SUPER_ADMIN'
ROLE_USER = 'USER'


# ===========================================================================
# USER – Profile endpoints
# ===========================================================================

@api_bp.route('/profile/me', methods=['GET'])
@jwt_required()
def get_my_profile():
    """Return the authenticated user's own profile."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error='Not Found', message='User not found.'), 404
    profile = user.profile
    if not profile:
        if user.role in (ROLE_ADMIN, ROLE_SUPER_ADMIN):
            profile = Profile(
                user_id=user.id,
                type='GROOM',
                bio='System Administrator Account',
                visible=True,
                approval_status='APPROVED',
                dob='1990-01-01',
                height="5'10\"",
                gotra_self='System',
                gotra_mother='System',
                education='IT',
                profession='Administrator',
                district='Bhopal',
                community='Mewada',
                contact=user.phone
            )
            try:
                db.session.add(profile)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"[ERROR] Auto-creating admin profile: {e}")
                return jsonify(error='Server Error', message='Failed to initialize admin profile.'), 500
        else:
            return jsonify(error='Not Found', message='Profile not found.'), 404

    image_url = None
    if profile.image_path:
        image_url = f'/api/profile/image/{profile.image_path}'

    return jsonify(
        user_id=user_id,
        username=user.username,
        phone=user.phone,
        type=profile.type,
        bio=profile.bio,
        visible=profile.visible,
        approval_status=profile.approval_status,
        image_url=image_url,
        dob=profile.dob,
        height=profile.height,
        gotra_self=profile.gotra_self,
        gotra_mother=profile.gotra_mother,
        education=profile.education,
        profession=profile.profession,
        district=profile.district,
        community=profile.community,
        father_name=profile.father_name,
        mother_name=profile.mother_name,
        address=profile.address,
        contact=profile.contact,
        brothers=profile.brothers,
        sisters=profile.sisters,
        family_type=profile.family_type,
        parents_occupation=profile.parents_occupation,
        created_at=profile.created_at.isoformat(),
    ), 200


@api_bp.route('/profile/me', methods=['PUT'])
@jwt_required()
def edit_my_profile():
    """Edit the authenticated user's profile."""
    user_id = int(get_jwt_identity())
    profile = Profile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify(error='Not Found', message='Profile not found.'), 404
    if profile.approval_status == 'APPROVED' and profile.user.role not in (ROLE_ADMIN, ROLE_SUPER_ADMIN):
        return jsonify(error='Bad Request', message='Approved profiles cannot be edited.'), 400

    data = request.get_json(silent=True) or {}
    
    # Update fields if present
    if 'bio' in data: profile.bio = str(data['bio']).strip()
    if 'dob' in data: profile.dob = str(data['dob']).strip()
    if 'height' in data: profile.height = str(data['height']).strip()
    if 'gotra_self' in data: profile.gotra_self = str(data['gotra_self']).strip()
    if 'gotra_mother' in data: profile.gotra_mother = str(data['gotra_mother']).strip()
    if 'education' in data: profile.education = str(data['education']).strip()
    if 'profession' in data: profile.profession = str(data['profession']).strip()
    if 'district' in data: profile.district = str(data['district']).strip()
    if 'community' in data: profile.community = str(data['community']).strip()
    if 'father_name' in data: profile.father_name = str(data['father_name']).strip()
    if 'mother_name' in data: profile.mother_name = str(data['mother_name']).strip()
    if 'address' in data: profile.address = str(data['address']).strip()
    if 'contact' in data: profile.contact = str(data['contact']).strip()
    if 'brothers' in data: profile.brothers = str(data['brothers']).strip()
    if 'sisters' in data: profile.sisters = str(data['sisters']).strip()
    if 'family_type' in data: profile.family_type = str(data['family_type']).strip()
    if 'parents_occupation' in data: profile.parents_occupation = str(data['parents_occupation']).strip()

    # Also let them update their full name (stored in User.username)
    if 'username' in data or 'name' in data:
        new_name = data.get('username') or data.get('name')
        if new_name and profile.user:
            profile.user.username = str(new_name).strip()

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify(error='Server Error', message='Could not update profile.'), 500

    return jsonify(message='Profile updated successfully.'), 200


@api_bp.route('/profile/request_approval', methods=['POST'])
@jwt_required()
def request_approval():
    """Transition profile status from SENT → PENDING (triggers admin review)."""
    user_id = int(get_jwt_identity())
    profile = Profile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify(error='Not Found', message='Profile not found.'), 404
    if profile.approval_status != 'SENT':
        return jsonify(error='Bad Request', message='Approval has already been requested.'), 400

    profile.approval_status = 'PENDING'
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify(error='Server Error', message='Could not request approval.'), 500

    return jsonify(message='Approval requested. An admin will review your profile.'), 200


@api_bp.route('/profiles', methods=['GET'])
@jwt_required()
def list_approved_profiles():
    """Browse all visible, approved profiles. Available only to approved users."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or not user.is_approved:
        return jsonify(error='Forbidden', message='Only approved users can browse profiles.'), 403

    profiles = Profile.query.filter_by(visible=True, approval_status='APPROVED').all()

    result = []
    for p in profiles:
        result.append({
            'user_id': p.user_id,
            'username': p.user.username if p.user else None,
            'phone': p.user.phone if p.user else None,
            'type': p.type,
            'bio': p.bio,
            'image_url': f'/api/profile/image/{p.image_path}' if p.image_path else None,
            'dob': p.dob,
            'height': p.height,
            'gotra_self': p.gotra_self,
            'gotra_mother': p.gotra_mother,
            'education': p.education,
            'profession': p.profession,
            'district': p.district,
            'community': p.community,
            'father_name': p.father_name,
            'mother_name': p.mother_name,
            'address': p.address,
            'contact': p.contact,
            'brothers': p.brothers,
            'sisters': p.sisters,
            'family_type': p.family_type,
            'parents_occupation': p.parents_occupation,
        })
    return jsonify(profiles=result), 200


# ===========================================================================
# USER – Image upload / serve
# ===========================================================================

@api_bp.route('/profile/upload_image', methods=['POST'])
@jwt_required()
def upload_image():
    """Upload a profile picture. Replaces any existing image."""
    user_id = int(get_jwt_identity())
    profile = Profile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify(error='Not Found', message='Profile not found.'), 404

    if 'file' not in request.files:
        return jsonify(error='Bad Request', message='No file part in the request.'), 400

    file = request.files['file']
    is_valid, msg = validate_image_file(file)
    if not is_valid:
        return jsonify(error='Bad Request', message=msg), 400

    upload_path = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_path, exist_ok=True)

    # Delete old image to keep uploads folder tidy
    if profile.image_path:
        old_path = os.path.join(upload_path, profile.image_path)
        if os.path.isfile(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass  # non-fatal

    filename = sanitize_filename(file.filename)
    try:
        file.save(os.path.join(upload_path, filename))
    except Exception:
        return jsonify(error='Server Error', message='Failed to save the uploaded file.'), 500

    profile.image_path = filename
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify(error='Server Error', message='Failed to update profile.'), 500

    return jsonify(
        message='Image uploaded successfully.',
        image_url=f'/api/profile/image/{filename}',
    ), 201


@api_bp.route('/profile/image/<path:filename>', methods=['GET'])
def get_profile_image(filename):
    """Serve a stored profile image with long-lived cache headers."""
    upload_path = current_app.config['UPLOAD_FOLDER']
    full_path = os.path.join(upload_path, filename)
    if not os.path.isfile(full_path):
        return jsonify(error='Not Found', message='Image not found.'), 404

    response = send_from_directory(upload_path, filename)
    response.headers['Cache-Control'] = 'public, max-age=2592000, immutable'  # 30 days
    return response


# ===========================================================================
# ADMIN – Approval management
# ===========================================================================

@api_bp.route('/admin/requests', methods=['GET'])
@jwt_required()
@role_required([ROLE_ADMIN, ROLE_SUPER_ADMIN])
def admin_pending_requests():
    """List all profiles that are PENDING approval."""
    pending = Profile.query.filter_by(approval_status='PENDING').all()
    out = []
    for p in pending:
        image_url = None
        if p.image_path:
            image_url = f'/api/profile/image/{p.image_path}'
        out.append({
            'user_id': p.user_id,
            'username': p.user.username if p.user else None,
            'email': p.user.email if p.user else None,
            'phone': p.user.phone if p.user else None,
            'type': p.type,
            'bio': p.bio,
            'dob': p.dob,
            'height': p.height,
            'gotra_self': p.gotra_self,
            'gotra_mother': p.gotra_mother,
            'education': p.education,
            'profession': p.profession,
            'district': p.district,
            'community': p.community,
            'contact': p.contact,
            'father_name': p.father_name,
            'mother_name': p.mother_name,
            'address': p.address,
            'brothers': p.brothers,
            'sisters': p.sisters,
            'family_type': p.family_type,
            'parents_occupation': p.parents_occupation,
            'image_url': image_url,
            'created_at': p.created_at.isoformat(),
        })
    return jsonify(pending=out), 200


@api_bp.route('/admin/approve/<int:user_id>', methods=['POST'])
@jwt_required()
@role_required([ROLE_ADMIN, ROLE_SUPER_ADMIN])
def admin_approve(user_id):
    """Approve a pending profile – makes it visible on the platform."""
    admin_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error='Not Found', message='User not found.'), 404
    profile = user.profile
    if not profile:
        return jsonify(error='Not Found', message='Profile not found.'), 404

    try:
        user.is_approved = True
        profile.approval_status = 'APPROVED'
        profile.visible = True
        log = AdminActionLog(admin_id=admin_id, action_type='APPROVE', target_user_id=user_id)
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify(error='Server Error', message='Approval failed.'), 500

    return jsonify(message=f'User {user.username} has been approved.'), 200


@api_bp.route('/admin/reject/<int:user_id>', methods=['POST'])
@jwt_required()
@role_required([ROLE_ADMIN, ROLE_SUPER_ADMIN])
def admin_reject(user_id):
    """Reject a pending profile – hides it from the platform."""
    admin_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error='Not Found', message='User not found.'), 404
    profile = user.profile
    if not profile:
        return jsonify(error='Not Found', message='Profile not found.'), 404

    try:
        user.is_approved = False
        profile.approval_status = 'REJECTED'
        profile.visible = False
        log = AdminActionLog(admin_id=admin_id, action_type='REJECT', target_user_id=user_id)
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify(error='Server Error', message='Rejection failed.'), 500

    return jsonify(message=f'User {user.username} has been rejected.'), 200


@api_bp.route('/admin/delete_user/<int:user_id>', methods=['DELETE'])
@jwt_required()
@role_required([ROLE_ADMIN, ROLE_SUPER_ADMIN])
def admin_delete_user(user_id):
    """Permanently delete a user and their profile (cascade)."""
    admin_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error='Not Found', message='User not found.'), 404
    if user.role in (ROLE_ADMIN, ROLE_SUPER_ADMIN):
        return jsonify(error='Forbidden', message='Admins cannot be deleted through this endpoint.'), 403

    try:
        log = AdminActionLog(admin_id=admin_id, action_type='DELETE', target_user_id=user_id)
        db.session.add(log)
        db.session.flush()
        db.session.delete(user)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify(error='Server Error', message='Deletion failed.'), 500

    return jsonify(message='User deleted successfully.'), 200


# ===========================================================================
# SUPER_ADMIN – Admin management & stats
# ===========================================================================

@api_bp.route('/superadmin/admins', methods=['GET'])
@jwt_required()
@role_required([ROLE_SUPER_ADMIN])
def list_admins():
    """List all admin accounts."""
    admins = User.query.filter_by(role=ROLE_ADMIN).all()
    out = [
        {
            'id': a.id,
            'username': a.username,
            'email': a.email,
            'created_at': a.created_at.isoformat(),
        }
        for a in admins
    ]
    return jsonify(admins=out), 200


@api_bp.route('/superadmin/create_admin', methods=['POST'])
@jwt_required()
@role_required([ROLE_SUPER_ADMIN])
def create_admin():
    """Create a new admin account."""
    data = request.get_json(silent=True) or {}
    phone = normalize_phone(data.get('phone', ''))
    username = data.get('username', '').strip()
    password = data.get('password', '')
    email = data.get('email', '').strip().lower()

    if not phone or not password or not username:
        return jsonify(error='Bad Request', message='username, phone, and password are required.'), 400
    if len(password) < 8:
        return jsonify(error='Bad Request', message='Password must be at least 8 characters.'), 400

    if User.query.filter_by(phone=phone).first():
        return jsonify(error='Conflict', message='Phone number already exists.'), 409

    try:
        admin_user = User(
            phone=phone,
            username=username,
            email=email if email else None,
            password_hash=hash_password(password),
            role=ROLE_ADMIN,
            is_approved=True,
            email_verified=True,
        )
        db.session.add(admin_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] create_admin: {e}")
        return jsonify(error='Server Error', message='Failed to create admin.'), 500

    return jsonify(message=f'Admin {username} created successfully.'), 201


@api_bp.route('/superadmin/delete_admin/<int:admin_id>', methods=['DELETE'])
@jwt_required()
@role_required([ROLE_SUPER_ADMIN])
def delete_admin(admin_id):
    """Remove an admin account."""
    admin = User.query.filter_by(id=admin_id, role=ROLE_ADMIN).first()
    if not admin:
        return jsonify(error='Not Found', message='Admin not found.'), 404

    try:
        db.session.delete(admin)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify(error='Server Error', message='Deletion failed.'), 500

    return jsonify(message='Admin deleted successfully.'), 200


@api_bp.route('/superadmin/change_admin_role/<int:user_id>', methods=['POST'])
@jwt_required()
@role_required([ROLE_SUPER_ADMIN])
def change_admin_role(user_id):
    """Promote a USER to ADMIN or demote an ADMIN to USER."""
    data = request.get_json(silent=True) or {}
    new_role = data.get('role', '').upper()
    if new_role not in (ROLE_USER, ROLE_ADMIN):
        return jsonify(error='Bad Request', message='role must be USER or ADMIN.'), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error='Not Found', message='User not found.'), 404
    if user.role == ROLE_SUPER_ADMIN:
        return jsonify(error='Forbidden', message='Cannot change the Super Admin role.'), 403

    user.role = new_role
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify(error='Server Error', message='Role update failed.'), 500

    return jsonify(message=f'User {user.username} role updated to {new_role}.'), 200


@api_bp.route('/superadmin/stats', methods=['GET'])
@jwt_required()
@role_required([ROLE_SUPER_ADMIN])
def superadmin_stats():
    """Aggregate statistics for the super-admin dashboard."""
    total_users = User.query.filter_by(role=ROLE_USER).count()
    approved = User.query.filter_by(role=ROLE_USER, is_approved=True).count()
    pending = Profile.query.filter_by(approval_status='PENDING').count()
    total_admins = User.query.filter_by(role=ROLE_ADMIN).count()
    total_actions = AdminActionLog.query.count()
    approved_actions = AdminActionLog.query.filter_by(action_type='APPROVE').count()
    rejected_actions = AdminActionLog.query.filter_by(action_type='REJECT').count()
    deleted_actions = AdminActionLog.query.filter_by(action_type='DELETE').count()

    return jsonify(
        total_users=total_users,
        approved_users=approved,
        pending_approvals=pending,
        total_admins=total_admins,
        admin_actions=total_actions,
        approved_count=approved_actions,
        rejected_count=rejected_actions,
        deleted_count=deleted_actions,
    ), 200
