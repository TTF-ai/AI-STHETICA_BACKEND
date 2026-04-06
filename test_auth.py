import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from APIs.models import User
from APIs.serializers import RegisterSerializer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

# Test Register
data = {"username": "testuser", "email": "test@example.com", "password": "TestPassword123"}
# clean up if exists
User.objects.filter(username="testuser").delete()

s = RegisterSerializer(data=data)
if s.is_valid():
    user = s.save()
    print("User created:", user.username)
    print("Email stored:", user.email)
    print("Is verified:", user.is_verified)
    print("Verification code generated:", user.verification_code is not None)
else:
    print("Register error:", s.errors)

# Test Verification
print("\n--- Simulating Verification ---")
db_user = User.objects.get(username="testuser")
db_user.is_verified = True
db_user.save()
print("User is now verified:", db_user.is_verified)

# Test Login
print("\n--- Simulating Login ---")
auth_user = authenticate(username="testuser", password="TestPassword123")
if auth_user:
    print("Authentication successful!")
    if auth_user.is_verified:
        print("User is verified. Generating tokens...")
        refresh = RefreshToken.for_user(auth_user)
        print("Refresh token length:", len(str(refresh)))
        print("Access token length:", len(str(refresh.access_token)))
    else:
        print("User not verified.")
else:
    print("Authentication failed.")
