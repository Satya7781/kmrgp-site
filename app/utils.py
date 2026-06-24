import os
import secrets
from datetime import timedelta
from werkzeug.utils import secure_filename
from itsdangerous import URLSafeTimedSerializer
from flask_mail import Message
import bcrypt


class Config:
    """Production configuration loaded from environment variables."""

    # Security keys – MUST be set in .env for production
    SECRET_KEY = os.environ.get('SECRET_KEY', os.urandom(32).hex())
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', os.urandom(32).hex())

    # JWT settings
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=1)
    JWT_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'
    JWT_COOKIE_SAMESITE = 'Lax'

    # Database – PostgreSQL for production, SQLite fallback for local dev
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'sqlite:///app.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
    }

    # File upload settings
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join(os.path.dirname(__file__), 'uploads'))
    MAX_CONTENT_LENGTH = 30 * 1024 * 1024  # 30 MB

    # Allowed image extensions (any image type the prompt specified)
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'heic'}

    # Mail configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'false').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')

    # Email verification token expiry (seconds)
    EMAIL_VERIFICATION_TOKEN_EXPIRY = 3600  # 1 hour

    # Base URL for building links in emails
    BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5000')


# ---------------------------------------------------------------------------
# File helpers
# ---------------------------------------------------------------------------

def allowed_file(filename: str) -> bool:
    """Return True if the filename has an allowed image extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS


def sanitize_filename(filename: str) -> str:
    """Secure and randomise an uploaded filename to prevent collisions / path traversal."""
    safe_name = secure_filename(filename)

    # If secure_filename returns empty (non-latin chars), generate a name
    if not safe_name:
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'jpg'
        safe_name = f"upload_{secrets.token_hex(8)}.{ext}"

    # Add random prefix to prevent overwrites
    random_prefix = secrets.token_hex(8)
    name_parts = safe_name.rsplit('.', 1)
    if len(name_parts) == 2:
        safe_name = f"{random_prefix}_{name_parts[0]}.{name_parts[1]}"
    else:
        safe_name = f"{random_prefix}_{safe_name}.jpg"

    return safe_name


def validate_image_file(file) -> tuple:
    """Validate an uploaded image file.  Returns (is_valid: bool, message: str)."""
    if file is None:
        return False, "No file provided"
    if file.filename == '':
        return False, "No file selected"
    if not allowed_file(file.filename):
        return False, f"Invalid file type. Allowed types: {', '.join(sorted(Config.ALLOWED_EXTENSIONS))}"
    return True, "Valid file"


# ---------------------------------------------------------------------------
# Phone normalization helper
# ---------------------------------------------------------------------------

def normalize_phone(phone_str: str) -> str:
    """Normalize a phone number to standard 10 digits for Indian numbers, stripping format characters."""
    if not phone_str:
        return ""
    # Strip spaces, dashes, parentheses, plus sign, etc.
    digits = "".join(c for c in phone_str if c.isdigit())
    if len(digits) > 10:
        if len(digits) == 12 and digits.startswith('91'):
            return digits[2:]
        if len(digits) == 11 and digits.startswith('0'):
            return digits[1:]
        return digits[-10:]
    return digits


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash a password using bcrypt and return the utf-8 decoded string."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def check_password(password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its bcrypt hash."""
    try:
        password_bytes = password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Email verification token helpers
# ---------------------------------------------------------------------------

def generate_verification_token(email: str) -> str:
    """Generate a time-limited signed token for email verification."""
    serializer = URLSafeTimedSerializer(Config.SECRET_KEY)
    return serializer.dumps(email, salt='email-verification-salt')

# Keep old name as alias so existing imports don't break
generate_confirmation_token = generate_verification_token


def verify_token(token: str, max_age: int = None):
    """Verify the email token.  Returns the email string on success, None on failure."""
    if max_age is None:
        max_age = Config.EMAIL_VERIFICATION_TOKEN_EXPIRY
    try:
        serializer = URLSafeTimedSerializer(Config.SECRET_KEY)
        email = serializer.loads(token, salt='email-verification-salt', max_age=max_age)
        return email
    except Exception:
        return None

# Keep old name as alias
def confirm_token(token: str, expiration: int = 3600):
    """Legacy alias – verify token and return email or raise ValueError."""
    result = verify_token(token, max_age=expiration)
    if result is None:
        raise ValueError('Invalid or expired confirmation token')
    return result


# ---------------------------------------------------------------------------
# Email sending helpers
# ---------------------------------------------------------------------------

def send_verification_email(email: str, token: str) -> bool:
    """Send an HTML email verification link to the given address."""
    from app import mail  # imported here to avoid circular imports
    try:
        verification_url = f"{Config.BASE_URL}/auth/verify-email?token={token}"

        subject = "Kshatriya Mewada Rajput Parivar – Verify Your Email"
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #8B0000; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }}
                .button {{ display: inline-block; background-color: #8B0000; color: white !important;
                           padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Kshatriya Mewada Rajput Parivar</h1>
                </div>
                <div class="content">
                    <h2>Welcome! Please Verify Your Email</h2>
                    <p>Thank you for registering with Kshatriya Mewada Rajput Parivar Matrimonial platform.</p>
                    <p>Please click the button below to verify your email address:</p>
                    <div style="text-align: center;">
                        <a href="{verification_url}" class="button">Verify Email Address</a>
                    </div>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #666; font-size: 14px;">{verification_url}</p>
                    <p><strong>This link will expire in 1 hour.</strong></p>
                    <p>If you did not create an account, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Kshatriya Mewada Rajput Parivar. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        from flask import current_app
        sender = current_app.config.get('MAIL_DEFAULT_SENDER') or Config.MAIL_DEFAULT_SENDER or "noreply@yourdomain.com"
        msg = Message(subject=subject, recipients=[email], html=html_body, sender=sender)
        mail.send(msg)
        return True
    except Exception as e:
        print(f"[ERROR] send_verification_email: {e}")
        return False


def send_email(subject: str, recipients: list, body: str = '', html: str = None) -> bool:
    """Generic email sender – kept for backwards compatibility."""
    from app import mail
    from flask import current_app
    try:
        sender = current_app.config.get('MAIL_DEFAULT_SENDER') or Config.MAIL_DEFAULT_SENDER or "noreply@yourdomain.com"
        msg = Message(subject=subject, recipients=recipients, body=body, html=html, sender=sender)
        mail.send(msg)
        return True
    except Exception as e:
        print(f"[ERROR] send_email: {e}")
        return False


# ---------------------------------------------------------------------------
# Role-based access decorator
# ---------------------------------------------------------------------------
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from flask import abort


def role_required(allowed_roles):
    """Decorator that enforces the JWT 'role' claim matches one of allowed_roles.

    Usage::

        @app.route('/admin')
        @jwt_required()
        @role_required(['ADMIN', 'SUPER_ADMIN'])
        def admin_view():
            ...
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get('role', '')
            if role not in allowed_roles:
                abort(403, description='Insufficient permissions')
            return fn(*args, **kwargs)
        return decorator
    return wrapper
