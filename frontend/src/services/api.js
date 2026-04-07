import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

// ── Request interceptor: attach JWT access token ──
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("access_token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ── Response interceptor: auto-refresh expired tokens ──
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet, try to refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("refresh_token")
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          "http://127.0.0.1:8000/api/token/refresh/",
          { refresh: localStorage.getItem("refresh_token") }
        );
        const newAccess = res.data.access;
        localStorage.setItem("access_token", newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth helpers ──
export const loginUser = (data) => API.post("login/", data);
export const registerUser = (data) => API.post("register/", data);
export const verifyUser = (data) => API.post("verify/", data);
export const changePassword = (data) => API.post("change-password/", data);
export const getUserProfile = () => API.get("profile/");
export const getDoctors = () => API.get("doctors/");

// ── Patient helpers ──
export const getPatients = () => API.get("patients/");
export const createPatient = (data) => API.post("patients/", data);

// ── Scan helpers ──
export const getScans = (params) => API.get("scans/", { params });
export const createPrescription = (data) => API.post("prescriptions/", data);
export const createScan = (formData) =>
  API.post("scans/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ── Report helpers (nurse) ──
export const getReports = (params) => API.get("reports/", { params });
export const createReport = (formData) =>
  API.post("reports/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ── Triage helpers (nurse) ──
export const triagePatient = (patientId, data) => API.patch(`patients/${patientId}/triage/`, data);

// ── Appointment helpers ──
export const getAppointments = () => API.get("appointments/");
export const createAppointment = (data) => API.post("appointments/", data);

export default API;