import { useEffect, useState } from "react";
import { getScans, getReports, getAppointments } from "../../services/api";

export default function PatientDashboard() {
  const [scans, setScans] = useState([]);
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const userName = localStorage.getItem("user_name") || "Patient";

  useEffect(() => {
    Promise.all([getScans(), getReports(), getAppointments()])
      .then(([sRes, rRes, aRes]) => {
        setScans(sRes.data);
        setReports(rRes.data);
        setAppointments(aRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  );

  if (loading)
    return <div style={s.container}><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;

  return (
    <div style={s.container}>
      <header style={s.header}>
        <h1 style={s.title}>My Health Dashboard</h1>
        <p style={s.subtitle}>Welcome, {userName}. Here's your latest health overview.</p>
      </header>

      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div>
            <p style={s.statLabel}>My Reports</p>
            <h3 style={s.statValue}>{reports.length}</h3>
          </div>
          <div style={{ ...s.statIcon, backgroundColor: "var(--primary-light)", color: "#0ea5e9" }}>📋</div>
        </div>
        <div style={s.statCard}>
          <div>
            <p style={s.statLabel}>Scans Done</p>
            <h3 style={s.statValue}>{scans.length}</h3>
          </div>
          <div style={{ ...s.statIcon, backgroundColor: "var(--border-color)", color: "#64748b" }}>🔬</div>
        </div>
        <div style={{ ...s.statCard, backgroundColor: "var(--primary-light)" }}>
          <div>
            <p style={s.statLabel}>Upcoming Appointments</p>
            <h3 style={s.statValue}>{upcomingAppointments.length}</h3>
          </div>
          <div style={{ ...s.statIcon, backgroundColor: "#dbeafe", color: "#3b82f6" }}>📅</div>
        </div>
      </div>

      <div style={s.grid}>
        {/* Reports shared by nurse */}
        <div style={s.card}>
          <h3 style={s.sectionTitle}>My Reports</h3>
          {reports.length === 0 ? (
            <p style={s.empty}>No reports shared yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {reports.map((r) => (
                <div key={r.id} style={s.reportItem}>
                  <div>
                    <p style={s.reportTitle}>{r.title}</p>
                    <p style={s.reportMeta}>
                      {r.report_type} • {new Date(r.created_at).toLocaleDateString()}
                      {r.uploaded_by_name && ` • by ${r.uploaded_by_name}`}
                    </p>
                  </div>
                  {r.file && (
                    <a href={r.file} target="_blank" rel="noreferrer" style={s.viewLink}>
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div style={s.card}>
          <h3 style={s.sectionTitle}>Upcoming Appointments</h3>
          {upcomingAppointments.length === 0 ? (
            <p style={s.empty}>No upcoming appointments.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {upcomingAppointments.map((a) => (
                <div key={a.id} style={s.appointmentItem}>
                  <div>
                    <p style={s.appointmentDoc}>Dr. {a.doctor_name}</p>
                    <p style={s.appointmentDate}>
                      {new Date(a.date_time).toLocaleString()}
                    </p>
                  </div>
                  <span style={s.statusBadge(a.status)}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { paddingTop: "20px" },
  header: { marginBottom: "32px" },
  title: { fontSize: "28px", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px", letterSpacing: "-0.5px" },
  subtitle: { fontSize: "15px", color: "var(--text-muted)" },
  statsRow: { display: "flex", gap: "24px", marginBottom: "32px" },
  statCard: { flex: 1, background: "var(--card-bg)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  statLabel: { color: "var(--text-muted)", fontSize: "13px", fontWeight: "500", marginBottom: "8px" },
  statValue: { color: "var(--text-main)", fontSize: "36px", fontWeight: "700", margin: 0, letterSpacing: "-1px" },
  statIcon: { width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" },
  card: { background: "var(--card-bg)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "var(--text-main)", marginBottom: "20px" },
  empty: { color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px 0" },
  reportItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", backgroundColor: "var(--bg-color)", borderRadius: "10px" },
  reportTitle: { fontSize: "14px", fontWeight: "600", color: "var(--text-main)", marginBottom: "4px" },
  reportMeta: { fontSize: "12px", color: "var(--text-muted)", textTransform: "capitalize" },
  viewLink: { color: "var(--primary)", fontSize: "13px", fontWeight: "600", textDecoration: "none" },
  appointmentItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", backgroundColor: "var(--bg-color)", borderRadius: "12px" },
  appointmentDoc: { fontSize: "14px", fontWeight: "600", color: "var(--text-main)", marginBottom: "4px" },
  appointmentDate: { fontSize: "12px", color: "var(--text-muted)" },
  statusBadge: (status) => {
    const colors = { pending: "#f59e0b", confirmed: "#10b981", completed: "#64748b", cancelled: "#ef4444" };
    return {
      backgroundColor: (colors[status] || "#64748b") + "20",
      color: colors[status] || "#64748b",
      padding: "4px 10px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "600",
      textTransform: "capitalize",
    };
  },
};
