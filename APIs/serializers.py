from rest_framework import serializers
from .models import User,Patient, ScanLog


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_verified=False,
        )
        user.generate_code()
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