from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User,Patient, ScanLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['id', 'username', 'email','password','is_active' ,'is_verified', 'is_staff', 'date_joined']
    list_filter = ['is_verified', 'is_staff']
    search_fields = ['username', 'email']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Verification', {'fields': ('is_verified', 'verification_code')}),
    )

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('name', 'age', 'gender', 'phone', 'created_at')
    search_fields = ('name', 'phone')


@admin.register(ScanLog)
class ScanLogAdmin(admin.ModelAdmin):
    list_display = ('patient', 'predicted_disease', 'confidence', 'created_at')
    list_filter = ('predicted_disease',)