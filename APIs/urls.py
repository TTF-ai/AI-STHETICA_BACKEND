from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, VerifyView, LoginView, ChangePasswordView,
    UserProfileView, PatientViewSet, ScanLogViewSet,
    PatientReportViewSet, PatientTriageView, AppointmentViewSet,
    DoctorListView, PrescriptionViewSet
)

urlpatterns = [
    # Auth
    path("register/", RegisterView.as_view(), name="register"),
    path("verify/", VerifyView.as_view(), name="verify"),
    path("login/", LoginView.as_view(), name="login"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("doctors/", DoctorListView.as_view(), name="doctors"),

    # Patients
    path("patients/", PatientViewSet.as_view({'get': 'list', 'post': 'create'}), name="patients"),

    # Scans
    path("scans/", ScanLogViewSet.as_view({'get': 'list', 'post': 'create'}), name="scans"),

    # Reports (nurse uploads)
    path("reports/", PatientReportViewSet.as_view({'get': 'list', 'post': 'create'}), name="reports"),

    # Triage
    path("patients/<int:pk>/triage/", PatientTriageView.as_view(), name="patient-triage"),

    # Appointments
    path("appointments/", AppointmentViewSet.as_view({'get': 'list', 'post': 'create'}), name="appointments"),

    # Prescriptions
    path("prescriptions/", PrescriptionViewSet.as_view({'get': 'list', 'post': 'create'}), name="prescriptions"),
]