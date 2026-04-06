from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, VerifyView, LoginView,PatientViewSet, ScanLogViewSet

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("verify/", VerifyView.as_view(), name="verify"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("patients/", PatientViewSet.as_view({'get': 'list', 'post': 'create'}), name="patients"),
    path("scans/", ScanLogViewSet.as_view({'get': 'list', 'post': 'create'}), name="scans"),
]