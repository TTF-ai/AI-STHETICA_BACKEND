import { useEffect, useState } from "react";
import { getPatients, getScans } from "../../services/api";

export default function NurseDashboard() {
  const [patients, setPatients] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  const userName = localStorage.getItem("user_name") || "Nurse";

  useEffect(() => {
    Promise.all([getPatients(), getScans()])
      .then(([pRes, sRes]) => {
        setPatients(pRes.data);
        setScans(sRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalVisited = patients.length;
  const highRisk = patients.filter((p) => p.risk_zone === "high").length;
  const recentScans = scans.slice(0, 5);

  if (loading)
    return <div style={s.container}><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;

  return (
    <div style={s.container}>
      <header style={s.header}>
        <h1 style={s.title}>Nurse Dashboard</h1>
        <p style={s.subtitle}>Welcome, Nurse {userName}. Here's your shift overview.</p>
      </header>

      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div>
            <p style={s.statLabel}>Patients Visited</p>
            <h3 style={s.statValue}>{totalVisited}</h3>
          </div>
          <div style={{ ...s.statIcon, backgroundColor: "var(--primary-light)", color: "#0ea5e9" }}>👥</div>
        </div>

        <div style={{ ...s.statCard, backgroundColor: "var(--danger-light)" }}>
          <div>
            <p style={s.statLabel}>High Risk Patients</p>
            <h3 style={s.statValue}>{highRisk}</h3>
            {highRisk > 0 && <p style={s.statSubDanger}>⚠️ Needs triage</p>}
          </div>
          <div style={{ ...s.statIcon, backgroundColor: "var(--danger-light)", color: "#ef4444" }}>🔺</div>
        </div>

        <div style={s.statCard}>
          <div>
            <p style={s.statLabel}>Recent Scans</p>
            <h3 style={s.statValue}>{scans.length}</h3>
          </div>
          <div style={{ ...s.statIcon, backgroundColor: "var(--border-color)", color: "#64748b" }}>🔬</div>
        </div>
      </div>

      {/* Recent Scans */}
      <div style={s.card}>
        <h3 style={s.sectionTitle}>Recent Scans</h3>
        {recentScans.length === 0 ? (
          <p style={s.empty}>No scans yet.</p>
        ) : (
          <div style={s.table}>
            <div style={s.tableHeader}>
              <span style={s.cell}>DISEASE</span>
              <span style={s.cellSmall}>RISK SCORE</span>
              <span style={s.cell}>DATE</span>
            </div>
            {recentScans.map((sc) => {
              const score = sc.risk_score ?? sc.confidence ?? 0;
              return (
              <div key={sc.id} style={s.tableRow}>
                <span style={s.cell}>{sc.predicted_disease}</span>
                <span style={s.cellSmall}>{score.toFixed(1)}%</span>
                <span style={s.cell}>{new Date(sc.created_at).toLocaleDateString()}</span>
              </div>
            );
            })}
          </div>
        )}
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
  statSubDanger: { color: "var(--danger)", fontSize: "12px", fontWeight: "500", marginTop: "8px" },
  statIcon: { width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" },
  card: { background: "var(--card-bg)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "var(--text-main)", marginBottom: "20px" },
  empty: { color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px 0" },
  table: { display: "flex", flexDirection: "column" },
  tableHeader: { display: "flex", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)", fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" },
  tableRow: { display: "flex", padding: "12px 0", borderBottom: "1px solid var(--border-color)", fontSize: "14px", fontWeight: "500", color: "var(--text-main)" },
  cell: { flex: 1 },
  cellSmall: { flex: 0.5 },
};
