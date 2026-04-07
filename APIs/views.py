from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework import viewsets, permissions
from django.shortcuts import get_object_or_404
from django.db.models import Q
from ml_models.predictor import predict_lesion

from .models import User, Patient, ScanLog, PatientReport, Appointment, Prescription
from .serializers import (
    RegisterSerializer, ScanLogSerializer, PatientSerializer,
    ChangePasswordSerializer, PatientReportSerializer, AppointmentSerializer,
    PatientTriageSerializer, PrescriptionSerializer
)
from .utils.smtp import send_otp_email


# -----------------------------
# REGISTER
# -----------------------------

class RegisterView(APIView):

    def get(self, request):
        return Response({
            "endpoint": "Register",
            "method": "POST",
            "required_fields": ["username", "email", "password", "role"]
        })

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"message": None, "data": None, "error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.save()

        # Send verification email (console backend in development)
        send_otp_email(
            otp=user.verification_code,
            email=user.email,
        )

        return Response(
            {"message": "User registered. Check email for verification code.", "data": {"user_name": user.username}, "error": None},
            status=status.HTTP_201_CREATED
        )


# -----------------------------
# VERIFY ACCOUNT
# -----------------------------

class VerifyView(APIView):

    def get(self, request):
        return Response({
            "endpoint": "Verify Account",
            "method": "POST",
            "required_fields": ["username", "verification_code"]
        })

    def post(self, request):
        username = request.data.get("username")
        code = request.data.get("verification_code")

        if not username or not code:
            return Response(
                {"message": None, "data": None, "error": "Username and verification_code are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"message": None, "data": None, "error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if user.verification_code != str(code):
            return Response(
                {"message": None, "data": None, "error": "Invalid verification code"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.is_verified = True
        user.verification_code = None  # Clear code after use
        user.save()

        return Response({"message": "Account verified successfully", "data": None, "error": None})


# -----------------------------
# LOGIN (JWT)
# -----------------------------

class LoginView(APIView):

    def get(self, request):
        return Response({
            "endpoint": "Login",
            "method": "POST",
            "required_fields": ["username", "password"]
        })

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"message": None, "data": None, "error": "Username and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {"message": None, "data": None, "error": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.is_verified:
            return Response(
                {"message": None, "data": None, "error": "Account not verified"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Login successful",
            "data": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user_name": user.username,
                "user_id": str(user.id),
                "role": user.role,
            },
            "error": None
        })


# -----------------------------
# USER PROFILE
# -----------------------------

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        })


# -----------------------------
# DOCTORS
# -----------------------------

class DoctorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        doctors = User.objects.filter(role='doctor')
        data = [{"id": d.id, "username": d.username} for d in doctors]
        return Response(data)


# -----------------------------
# PATIENTS (role-aware)
# -----------------------------

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            return Patient.objects.filter(Q(user=user) | Q(appointments__doctor=user)).distinct()
        elif user.role == 'nurse':
            return Patient.objects.filter(user=user)
        elif user.role == 'patient':
            return Patient.objects.filter(user=user)
        return Patient.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# -----------------------------
# SCAN LOGS (role-aware)
# -----------------------------

class ScanLogViewSet(viewsets.ModelViewSet):
    serializer_class = ScanLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            qs = ScanLog.objects.filter(Q(patient__user=user) | Q(patient__appointments__doctor=user)).distinct()
        elif user.role == 'nurse':
            qs = ScanLog.objects.filter(patient__user=user)
        elif user.role == 'patient':
            qs = ScanLog.objects.filter(patient__user=user)
        else:
            qs = ScanLog.objects.none()

        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        scan_log = serializer.save(predicted_disease="Calculating...", confidence=0.0)

        try:
            from ml_models.predictor import predict_lesion, CLASSES, compute_risk_score

            image_path = scan_log.image.path

            # Single inference returning top class, confidence, and full prob vector
            top_class, confidence, raw_probs = predict_lesion(image_path)

            # Compute weighted risk score from the raw softmax probabilities
            risk_score, agg = compute_risk_score(raw_probs)

            # Category thresholds: <44 LOW, 44-66 MEDIUM, >=67 HIGH
            if risk_score >= 67:
                risk_category = "HIGH"
            elif risk_score >= 44:
                risk_category = "MEDIUM"
            else:
                risk_category = "LOW"

            all_probs = {CLASSES[i]: round(float(raw_probs[i]) * 100, 2) for i in range(len(CLASSES))}

            scan_log.predicted_disease = top_class
            scan_log.confidence        = round(confidence, 2)
            scan_log.risk_score        = round(risk_score, 1)
            scan_log.risk_category     = risk_category
            scan_log.all_probs         = all_probs
            scan_log.save()

            print(f"[Scan] {top_class} | conf={confidence:.1f}% | risk={risk_score:.1f} ({risk_category})")
            print(f"[Scan] Probs: { {k: f'{v:.1f}%' for k, v in all_probs.items()} }")

        except Exception as e:
            import traceback
            print(f"[Scan ERROR] {e}")
            traceback.print_exc()


# -----------------------------
# PATIENT REPORTS (nurse uploads)
# -----------------------------

class PatientReportViewSet(viewsets.ModelViewSet):
    serializer_class = PatientReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = PatientReport.objects.all()

        if user.role == 'patient':
            qs = qs.filter(patient__user=user)
        elif user.role == 'nurse':
            qs = qs.filter(patient__user=user)
        elif user.role == 'doctor':
            qs = qs.filter(Q(patient__user=user) | Q(patient__appointments__doctor=user)).distinct()

        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


# -----------------------------
# TRIAGE (nurse sets risk zone)
# -----------------------------

class PatientTriageView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk)
        serializer = PatientTriageSerializer(patient, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Risk zone updated.", "data": serializer.data})
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# APPOINTMENTS
# -----------------------------

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            return Appointment.objects.filter(doctor=user)
        elif user.role == 'patient':
            return Appointment.objects.filter(patient__user=user)
        elif user.role == 'nurse':
            return Appointment.objects.all()
        return Appointment.objects.none()


# -----------------------------
# CHANGE PASSWORD
# -----------------------------

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"error": "Wrong password."}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

# -----------------------------
# PRESCRIPTIONS
# -----------------------------

class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Prescription.objects.all()

        if user.role == 'patient':
            qs = qs.filter(patient__user=user)
        elif user.role == 'nurse':
            qs = qs.filter(patient__user=user)
        elif user.role == 'doctor':
            qs = qs.filter(Q(patient__user=user) | Q(patient__appointments__doctor=user)).distinct()

        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs