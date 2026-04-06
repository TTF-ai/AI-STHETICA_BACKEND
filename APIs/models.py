from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import User
import random


# Custom User model extending AbstractUser
class User(AbstractUser):
    is_verified = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, null=True, blank=True)

    def generate_code(self):
        self.verification_code = str(random.randint(100000, 999999))
        self.save()

    def __str__(self):
        return self.username

class Patient(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patients')
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    gender = models.CharField(max_length=10)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ScanLog(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='scans')
    image = models.ImageField(upload_to='scans/')
    predicted_disease = models.CharField(max_length=100)
    confidence = models.FloatField()
    heatmap_image = models.ImageField(upload_to='heatmaps/', blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.name} - {self.predicted_disease}"