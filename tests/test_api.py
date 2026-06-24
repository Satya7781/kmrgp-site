import unittest
import io
import json
from unittest.mock import patch
from app import create_app, db
from app.models import User, Profile, AdminActionLog
from app.utils import hash_password

class MatrimonialTestCase(unittest.TestCase):
    def setUp(self):
        """Set up a test client and clean SQLite database in memory for each test."""
        # Patch mail.send to prevent real SMTP connection attempts
        self.mail_patcher = patch('app.mail.send')
        self.mock_send = self.mail_patcher.start()

        # Use an in-memory database for fast, isolated tests
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SQLALCHEMY_ENGINE_OPTIONS': {},
            'JWT_SECRET_KEY': 'test-jwt-secret-key-12345',
            'SECRET_KEY': 'test-secret-key-12345',
            'MAIL_SUPPRESS_SEND': True,
            'MAIL_DEFAULT_SENDER': 'noreply@example.com'
        })
        
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        
        # Clean and recreate database tables
        db.drop_all()
        db.create_all()
        
        # Helper variables for standard credentials
        self.user_credentials = {
            'username': 'testuser',
            'phone': '9876543210',
            'password': 'Password123',
            'profile_type': 'GROOM',
            'bio': 'A lovely test groom bio.',
            'gotra_self': 'Dod',
            'gotra_mother': 'Rathore',
            'dob': '1999-04-12',
            'district': 'Bhopal',
            'education': 'Graduate',
            'profession': 'Software Engineer'
        }
        
    def tearDown(self):
        """Tear down database and pop context."""
        self.mail_patcher.stop()
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_phone_number_normalization(self):
        """Test that phone numbers with different formatting (+91, spaces, leading 0) are normalized and authenticate successfully."""
        credentials = self.user_credentials.copy()
        credentials['phone'] = '+91 95555 12345'
        
        response = self.client.post('/auth/register', json=credentials)
        self.assertEqual(response.status_code, 201)
        
        # Check that it got stored normalized (10 digits) in the database
        user = User.query.filter_by(phone='9555512345').first()
        self.assertIsNotNone(user)
        
        # Login with different formatting: 09555512345
        login_response = self.client.post('/auth/login', json={
            'phone': '09555512345',
            'password': 'Password123'
        })
        self.assertEqual(login_response.status_code, 200)
        self.assertIn('access_token', login_response.get_json())
        
        # Login with clean number: 9555512345
        login_response2 = self.client.post('/auth/login', json={
            'phone': '9555512345',
            'password': 'Password123'
        })
        self.assertEqual(login_response2.status_code, 200)

    def test_user_lifecycle_full(self):
        """Test registration, login, profile edit, admin approval, and browsing."""
        
        # 1. Register a new user
        response = self.client.post('/auth/register', json=self.user_credentials)
        self.assertEqual(response.status_code, 201)
        res_data = response.get_json()
        self.assertIn('Registration successful', res_data['message'])
        
        # Verify DB entry state
        user = User.query.filter_by(phone='9876543210').first()
        self.assertIsNotNone(user)
        self.assertTrue(user.email_verified)
        self.assertFalse(user.is_approved)
        self.assertEqual(user.profile.approval_status, 'SENT')
        
        # 2. Login
        login_response = self.client.post('/auth/login', json={
            'phone': '9876543210',
            'password': 'Password123'
        })
        self.assertEqual(login_response.status_code, 200)
        tokens = login_response.get_json()
        self.assertIn('access_token', tokens)
        self.assertIn('refresh_token', tokens)
        access_token = tokens['access_token']
        headers = {'Authorization': f'Bearer {access_token}'}
        
        # 3. Fetch and edit own profile
        profile_response = self.client.get('/api/profile/me', headers=headers)
        self.assertEqual(profile_response.status_code, 200)
        p_data = profile_response.get_json()
        self.assertEqual(p_data['approval_status'], 'SENT')
        self.assertEqual(p_data['bio'], 'A lovely test groom bio.')
        
        edit_response = self.client.put('/api/profile/me', headers=headers, json={'bio': 'Updated bio.'})
        self.assertEqual(edit_response.status_code, 200)
        self.assertEqual(user.profile.bio, 'Updated bio.')
        
        # 4. Try browsing other profiles before being approved (should fail 403)
        browse_response = self.client.get('/api/profiles', headers=headers)
        self.assertEqual(browse_response.status_code, 403)
        self.assertIn('approved users can browse', browse_response.get_json()['message'])
        
        # 5. Request Admin Approval
        req_response = self.client.post('/api/profile/request_approval', headers=headers)
        self.assertEqual(req_response.status_code, 200)
        self.assertEqual(user.profile.approval_status, 'PENDING')
        
        # 6. Set up an Admin to verify & approve
        admin = User(
            username='admin_john',
            phone='9999999999',
            password_hash=hash_password('Password123'),
            role='ADMIN',
            is_approved=True,
            email_verified=True
        )
        db.session.add(admin)
        db.session.commit()
        
        admin_login = self.client.post('/auth/login', json={
            'phone': '9999999999',
            'password': 'Password123'
        })
        self.assertEqual(admin_login.status_code, 200)
        admin_token = admin_login.get_json()['access_token']
        admin_headers = {'Authorization': f'Bearer {admin_token}'}
        
        # Admin gets pending requests
        requests_response = self.client.get('/api/admin/requests', headers=admin_headers)
        self.assertEqual(requests_response.status_code, 200)
        self.assertEqual(len(requests_response.get_json()['pending']), 1)
        
        # Admin approves the user
        approve_response = self.client.post(f'/api/admin/approve/{user.id}', headers=admin_headers)
        self.assertEqual(approve_response.status_code, 200)
        self.assertTrue(user.is_approved)
        self.assertEqual(user.profile.approval_status, 'APPROVED')
        self.assertTrue(user.profile.visible)
        
        # Verify action was logged
        log = AdminActionLog.query.filter_by(action_type='APPROVE', target_user_id=user.id).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.admin_id, admin.id)
        
        # 7. Now try browsing profiles with User token (should succeed now)
        browse_response = self.client.get('/api/profiles', headers=headers)
        self.assertEqual(browse_response.status_code, 200)
        self.assertEqual(len(browse_response.get_json()['profiles']), 1)
        self.assertEqual(browse_response.get_json()['profiles'][0]['username'], 'testuser')

        # 8. Admin deletes the user
        delete_response = self.client.delete(f'/api/admin/delete_user/{user.id}', headers=admin_headers)
        self.assertEqual(delete_response.status_code, 200)
        self.assertIn('deleted successfully', delete_response.get_json()['message'])

        # Verify cascade deletion from DB
        self.assertIsNone(db.session.get(User, user.id))
        self.assertIsNone(Profile.query.filter_by(user_id=user.id).first())
        
        # Verify delete action was logged
        delete_log = AdminActionLog.query.filter_by(action_type='DELETE', target_user_id=user.id).first()
        self.assertIsNotNone(delete_log)
        self.assertEqual(delete_log.admin_id, admin.id)

    def test_image_upload_and_validation(self):
        """Test file upload validation and successful image saving."""
        response = self.client.post('/auth/register', json=self.user_credentials)
        user = User.query.filter_by(phone='9876543210').first()
        user.is_approved = True
        user.profile.approval_status = 'APPROVED'
        db.session.commit()
        
        login_response = self.client.post('/auth/login', json={
            'phone': '9876543210',
            'password': 'Password123'
        })
        access_token = login_response.get_json()['access_token']
        headers = {'Authorization': f'Bearer {access_token}'}
        
        # Try uploading invalid file type
        data_invalid = {
            'file': (io.BytesIO(b"dummy contents"), 'test_file.txt')
        }
        upload_response = self.client.post('/api/profile/upload_image', headers=headers, data=data_invalid, content_type='multipart/form-data')
        self.assertEqual(upload_response.status_code, 400)
        self.assertIn('Invalid file type', upload_response.get_json()['message'])
        
        # Upload valid image
        data_valid = {
            'file': (io.BytesIO(b"dummy image data"), 'avatar.png')
        }
        upload_response = self.client.post('/api/profile/upload_image', headers=headers, data=data_valid, content_type='multipart/form-data')
        self.assertEqual(upload_response.status_code, 201)
        res_data = upload_response.get_json()
        self.assertIn('Image uploaded successfully', res_data['message'])
        self.assertIsNotNone(user.profile.image_path)
        self.assertTrue(user.profile.image_path.endswith('.png'))

    def test_super_admin_features(self):
        """Test Super Admin capabilities: create admin, list admins, demote, and statistics."""
        # Setup Super Admin
        super_admin = User(
            username='superboss',
            phone='8888888888',
            password_hash=hash_password('SuperPassword123'),
            role='SUPER_ADMIN',
            is_approved=True,
            email_verified=True
        )
        db.session.add(super_admin)
        db.session.commit()
        
        login_response = self.client.post('/auth/login', json={
            'phone': '8888888888',
            'password': 'SuperPassword123'
        })
        self.assertEqual(login_response.status_code, 200)
        token = login_response.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Create a new Admin
        create_response = self.client.post('/api/superadmin/create_admin', headers=headers, json={
            'username': 'new_admin',
            'phone': '7777777777',
            'password': 'AdminPassWord123'
        })
        self.assertEqual(create_response.status_code, 201)
        self.assertIn('created successfully', create_response.get_json()['message'])
        
        # Check admin user in DB
        admin_user = User.query.filter_by(phone='7777777777').first()
        self.assertIsNotNone(admin_user)
        self.assertEqual(admin_user.role, 'ADMIN')
        self.assertTrue(admin_user.is_approved)
        
        # List Admins
        list_response = self.client.get('/api/superadmin/admins', headers=headers)
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.get_json()['admins']), 1)
        
        # Update Role (Demote Admin to User)
        role_response = self.client.post(f'/api/superadmin/change_admin_role/{admin_user.id}', headers=headers, json={
            'role': 'USER'
        })
        self.assertEqual(role_response.status_code, 200)
        self.assertEqual(admin_user.role, 'USER')
        
        # Get Statistics
        stats_response = self.client.get('/api/superadmin/stats', headers=headers)
        self.assertEqual(stats_response.status_code, 200)
        stats = stats_response.get_json()
        self.assertIn('total_users', stats)
        self.assertIn('total_admins', stats)
        
if __name__ == '__main__':
    unittest.main()
