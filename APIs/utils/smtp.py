from django.core.mail import send_mail
from django.conf import settings

def send_otp_email(email, otp):
    subject = "Your OTP for Registration"
    message = f"""
Hello,

Your OTP for account verification is: {otp}

This OTP is valid for 5 minutes.

Do not share this with anyone.
"""
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )