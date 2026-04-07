from django.db import models
from django.contrib.auth.models import AbstractUser
import random


ROLE_CHOICES = [
    ('doctor', 'Doctor'),
    ('nurse', 'Nurse'),
    ('patient', 'Patient'),
]

RISK_ZONE_CHOICES = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
]

APPOINTMENT_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('confirmed', 'Confirmed'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
]

SCHEDULED_BY_CHOICES = [
    ('doctor', 'Doctor'),
    ('patient', 'Patient'),
]


# Custom User model extending AbstractUser
class User(AbstractUser):
    is_verified = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='doctor')

    def generate_code(self):
        self.verification_code = str(random.randint(100000, 999999))
        self.save()

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Patient(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patients')
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    gender = models.CharField(max_length=10)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    risk_zone = models.CharField(max_length=10, choices=RISK_ZONE_CHOICES, default='low')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ScanLog(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='scans')
    image = models.ImageField(upload_to='scans/')
    predicted_disease = models.CharField(max_length=100)
    confidence = models.FloatField()
    risk_score = models.FloatField(default=0.0)           # weighted 0-100 risk score
    risk_category = models.CharField(max_length=10, default='LOW')  # LOW / MEDIUM / HIGH
    all_probs = models.JSONField(default=dict, blank=True) # per-class probabilities
    heatmap_image = models.ImageField(upload_to='heatmaps/', blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.name} - {self.predicted_disease}"


class PatientReport(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='reports')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_reports')
    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=50, default='general')  # blood, xray, general, etc.
    file = models.FileField(upload_to='reports/', blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.name} - {self.title}"


class Appointment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_appointments', limit_choices_to={'role': 'doctor'})
    scheduled_by = models.CharField(max_length=10, choices=SCHEDULED_BY_CHOICES, default='doctor')
    date_time = models.DateTimeField()
    status = models.CharField(max_length=12, choices=APPOINTMENT_STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_time']

    def __str__(self):
        return f"{self.patient.name} → Dr.{self.doctor.username} on {self.date_time}"

class Prescription(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prescription for {self.patient.name}"