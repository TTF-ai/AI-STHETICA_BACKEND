import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import NewScan from "./pages/NewScan";
import Insights from "./pages/Insights";
import PatientHistory from "./pages/PatientHistory";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";

// Nurse pages
import NurseDashboard from "./pages/nurse/NurseDashboard";
import NursePatients from "./pages/nurse/NursePatients";
import NurseScan from "./pages/nurse/NurseScan";
import NurseTriage from "./pages/nurse/NurseTriage";

// Patient pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientAppointments from "./pages/patient/PatientAppointments";

// Auth guard — redirects to login if no token
function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

// Role guard — redirects unauthorized roles to their own dashboard
function RoleRoute({ children, allowedRoles }) {
  const role = localStorage.getItem("user_role") || "doctor";
  if (!allowedRoles.includes(role)) {
    // Redirect to the user's own dashboard
    const dashboards = { doctor: "/dashboard", nurse: "/nurse/dashboard", patient: "/patient/dashboard" };
    return <Navigate to={dashboards[role] || "/dashboard"} replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Doctor routes (existing — untouched) */}
        <Route path="/dashboard" element={<PrivateRoute><RoleRoute allowedRoles={["doctor"]}><Dashboard /></RoleRoute></PrivateRoute>} />
        <Route path="/patients" element={<PrivateRoute><RoleRoute allowedRoles={["doctor"]}><Patients /></RoleRoute></PrivateRoute>} />
        <Route path="/patients/:patientId/history" element={<PrivateRoute><RoleRoute allowedRoles={["doctor"]}><PatientHistory /></RoleRoute></PrivateRoute>} />
        <Route path="/scan" element={<PrivateRoute><RoleRoute allowedRoles={["doctor"]}><NewScan /></RoleRoute></PrivateRoute>} />
        <Route path="/insights" element={<PrivateRoute><RoleRoute allowedRoles={["doctor"]}><Insights /></RoleRoute></PrivateRoute>} />

        {/* Nurse routes */}
        <Route path="/nurse/dashboard" element={<PrivateRoute><RoleRoute allowedRoles={["nurse"]}><NurseDashboard /></RoleRoute></PrivateRoute>} />
        <Route path="/nurse/patients" element={<PrivateRoute><RoleRoute allowedRoles={["nurse"]}><NursePatients /></RoleRoute></PrivateRoute>} />
        <Route path="/nurse/scan" element={<PrivateRoute><RoleRoute allowedRoles={["nurse"]}><NurseScan /></RoleRoute></PrivateRoute>} />
        <Route path="/nurse/triage" element={<PrivateRoute><RoleRoute allowedRoles={["nurse"]}><NurseTriage /></RoleRoute></PrivateRoute>} />

        {/* Patient routes */}
        <Route path="/patient/dashboard" element={<PrivateRoute><RoleRoute allowedRoles={["patient"]}><PatientDashboard /></RoleRoute></PrivateRoute>} />
        <Route path="/patient/appointments" element={<PrivateRoute><RoleRoute allowedRoles={["patient"]}><PatientAppointments /></RoleRoute></PrivateRoute>} />

        {/* Shared routes (all roles) */}
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
