from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Patient, ScanLog, PatientReport, Appointment


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['id', 'username', 'email', 'role', 'is_active', 'is_verified', 'is_staff', 'date_joined']
    list_filter = ['is_verified', 'is_staff', 'role']
    search_fields = ['username', 'email']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Verification', {'fields': ('is_verified', 'verification_code')}),
        ('Role', {'fields': ('role',)}),
    )

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('name', 'age', 'gender', 'phone', 'risk_zone', 'created_at')
    list_filter = ('risk_zone', 'gender')
    search_fields = ('name', 'phone')

@admin.register(ScanLog)
class ScanLogAdmin(admin.ModelAdmin):
    list_display = ('patient', 'predicted_disease', 'confidence', 'created_at')
    list_filter = ('predicted_disease',)

@admin.register(PatientReport)
class PatientReportAdmin(admin.ModelAdmin):
    list_display = ('patient', 'title', 'report_type', 'uploaded_by', 'created_at')
    list_filter = ('report_type',)
    search_fields = ('patient__name', 'title')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'date_time', 'status', 'scheduled_by', 'created_at')
    list_filter = ('status', 'scheduled_by')
    search_fields = ('patient__name', 'doctor__username')