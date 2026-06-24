from app import db
from datetime import datetime, timezone


class User(db.Model):
    """User model – stores authentication credentials and role."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(20), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=True, index=True)
    # Role stored as plain string: USER | ADMIN | SUPER_ADMIN
    role = db.Column(db.String(20), nullable=False, default='USER')
    is_approved = db.Column(db.Boolean, default=False, nullable=False, index=True)
    email_verified = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # One-to-one relationship with Profile; cascade deletes profile when user is deleted
    profile = db.relationship(
        'Profile', backref='user', uselist=False, cascade='all, delete-orphan'
    )

    # Admin action logs authored by this user (when they are an admin)
    authored_actions = db.relationship(
        'AdminActionLog', foreign_keys='AdminActionLog.admin_id', backref='admin'
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return f'<User {self.phone!r} role={self.role}>'


class Profile(db.Model):
    """Matrimonial profile linked one-to-one with a User."""
    __tablename__ = 'profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id', ondelete='CASCADE'),
        unique=True,
        nullable=False,
    )
    # GROOM or BRIDE
    type = db.Column(db.String(10), nullable=False)
    bio = db.Column(db.Text, default='')
    visible = db.Column(db.Boolean, default=False, nullable=False, index=True)
    # Lifecycle: SENT → PENDING → APPROVED | REJECTED
    approval_status = db.Column(db.String(20), default='SENT', nullable=False, index=True)
    # Relative filename stored; absolute path resolved at runtime from UPLOAD_FOLDER config
    image_path = db.Column(db.String(500), nullable=True)

    # Matrimonial details
    dob = db.Column(db.String(50), nullable=True)
    height = db.Column(db.String(20), nullable=True)
    gotra_self = db.Column(db.String(80), nullable=True)
    gotra_mother = db.Column(db.String(80), nullable=True)
    education = db.Column(db.String(255), nullable=True)
    profession = db.Column(db.String(255), nullable=True)
    district = db.Column(db.String(80), nullable=True)
    community = db.Column(db.String(80), default='Mewada')
    
    father_name = db.Column(db.String(100), nullable=True)
    mother_name = db.Column(db.String(100), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    contact = db.Column(db.String(20), nullable=True)
    brothers = db.Column(db.String(50), nullable=True)
    sisters = db.Column(db.String(50), nullable=True)
    family_type = db.Column(db.String(80), nullable=True)
    parents_occupation = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return f'<Profile user_id={self.user_id} type={self.type} status={self.approval_status}>'


class AdminActionLog(db.Model):
    """Audit log – records every approve / reject / delete action by an admin."""
    __tablename__ = 'admin_action_logs'

    id = db.Column(db.Integer, primary_key=True)
    # SET NULL if the admin account is later deleted
    admin_id = db.Column(
        db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True
    )
    # APPROVE | REJECT | DELETE
    action_type = db.Column(db.String(20), nullable=False)
    target_user_id = db.Column(
        db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True
    )
    timestamp = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), index=True
    )

    target_user = db.relationship('User', foreign_keys=[target_user_id])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return (
            f'<AdminActionLog admin={self.admin_id} '
            f'action={self.action_type} target={self.target_user_id}>'
        )
