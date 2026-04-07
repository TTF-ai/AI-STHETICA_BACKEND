from rest_framework import serializers
from .models import User, Patient, ScanLog, PatientReport, Appointment, Prescription


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        role = validated_data.pop('role', 'doctor')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_verified=False,
            role=role,
        )
        user.generate_code()

        # Auto-create a Patient record when patient role registers
        if role == 'patient':
            Patient.objects.create(
                user=user,
                name=validated_data['username'],
                age=0,
                gender='Other',
                phone='',
                email=validated_data.get('email', ''),
            )

        return user


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ['user']


class ScanLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanLog
        fields = '__all__'
        read_only_fields = ['predicted_disease', 'confidence', 'risk_score', 'risk_category', 'all_probs']


class PatientReportSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = PatientReport
        fields = '__all__'
        read_only_fields = ['uploaded_by']


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.username', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'


class PatientTriageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'risk_zone']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = '__all__'