import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPatients, getScans } from "../services/api";

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userName = localStorage.getItem("user_name") || "Doctor";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, scansRes] = await Promise.all([
          getPatients(),
          getScans(),
        ]);
        setPatients(patientsRes.data);
        setScans(scansRes.data);
      } catch (err) {
        setError("Failed to load dashboard data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPatients = patients.length;
  const totalScans = scans.length;
  const recentScans = scans.slice(0, 5);
  // High risk = risk_score >= 67 (HIGH category) or risk_category === 'HIGH'
  const highRisk = scans.filter((s) =>
    s.risk_category === "HIGH" || (s.risk_score != null && s.risk_score >= 67)
  ).length;

  if (loading)
    return (
      <div style={styles.container}>
        <p style={{ color: "var(--text-muted)" }}>Loading dashboard...</p>
      </div>
    );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Dashboard Overview</h1>
        <p style={styles.subtitle}>
          Welcome back, Dr. {userName}. You have <strong style={{color: "var(--text-main)"}}>{highRisk} high-risk scans</strong> pending review.
        </p>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      {/* Stat Cards */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div>
            <p style={styles.statLabel}>Total Patients</p>
            <h3 style={styles.statValue}>{totalPatients}</h3>
          </div>
          <div style={{...styles.statIcon, backgroundColor: "var(--primary-light)", color: "#0ea5e9"}}>👥</div>
        </div>
        
        <div style={{...styles.statCard, backgroundColor: "var(--danger-light)"}}>
          <div>
            <p style={styles.statLabel}>High Risk Cases</p>
            <h3 style={styles.statValue}>{highRisk}</h3>
            {highRisk > 0 && <p style={styles.statSubtextDanger}>⚠️ Requires Attention</p>}
          </div>
          <div style={{...styles.statIcon, backgroundColor: "var(--danger-light)", color: "#ef4444"}}>❗</div>
        </div>

        <div style={styles.statCard}>
          <div>
            <p style={styles.statLabel}>Recent Scans</p>
            <h3 style={styles.statValue}>{totalScans}</h3>
          </div>
          <div style={{...styles.statIcon, backgroundColor: "var(--border-color)", color: "#64748b"}}>🔬</div>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Recent Patients Table */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
             <h3 style={styles.sectionTitle}>Recent Patient Activity</h3>
             <Link to="/patients" style={styles.viewAll}>View All Patients</Link>
          </div>
          
          <div style={styles.tableCard}>
            {patients.length === 0 ? (
              <p style={styles.empty}>No patients yet.</p>
            ) : (
              <div style={styles.table}>
                <div style={styles.tableHeader}>
                  <span style={styles.cell}>PATIENT NAME</span>
                  <span style={styles.cellSmall}>AGE</span>
                  <span style={styles.cell}>PHONE</span>
                  <span style={styles.cellRight}>ACTION</span>
                </div>
                {patients.slice(0, 5).map((p) => (
                  <div key={p.id} style={styles.tableRow}>
                    <span style={styles.cellName}>
                      <div style={styles.avatarSmall}>{p.name.charAt(0)}</div>
                      {p.name}
                    </span>
                    <span style={styles.cellSmall}>{p.age}</span>
                    <span style={styles.cell}>{p.phone}</span>
                    <span style={styles.cellRight}>
                      <Link to={`/patients/${p.id}/history`} style={styles.actionBtn}>
                        History
                      </Link>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Scans (Taking place of right sidebar elements to keep data real) */}
        <div style={styles.sectionRight}>
           <div style={styles.sectionHeader}>
             <h3 style={styles.sectionTitle}>Recent Scans</h3>
          </div>
          <div style={styles.tableCard}>
             {recentScans.length === 0 ? (
                <p style={styles.empty}>No scans yet.</p>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  {recentScans.map((s) => {
                    // risk_score is 0-100. confidence is also 0-100 (percentage).
                    // Use risk_score if available, fall back to confidence.
                    const score = s.risk_score ?? s.confidence ?? 0;
                    const cat = s.risk_category || (score >= 67 ? "HIGH" : score >= 44 ? "MEDIUM" : "LOW");
                    const riskColor = cat === "HIGH" ? "#EF5350" : cat === "MEDIUM" ? "#FFA726" : "#66BB6A";
                    const riskBg   = cat === "HIGH" ? "rgba(239,83,80,0.1)" : cat === "MEDIUM" ? "rgba(255,167,38,0.1)" : "rgba(102,187,106,0.1)";
                    return (
                    <div key={s.id} style={styles.scanItem}>
                      <div>
                         <p style={styles.scanDisease}>{s.predicted_disease}</p>
                         <p style={styles.scanDate}>{new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{ ...styles.scanRisk, color: riskColor, backgroundColor: riskBg }}>
                         {score.toFixed(1)}% Risk
                      </div>
                    </div>
                  );
                  })}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    paddingTop: "20px",
  },
  header: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "var(--text-main)",
    marginBottom: "8px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "15px",
    color: "var(--text-muted)",
  },
  error: {
    background: "var(--danger-light)",
    color: "var(--danger)",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "24px",
  },
  statsRow: {
    display: "flex",
    gap: "24px",
    marginBottom: "32px",
  },
  statCard: {
    flex: 1,
    background: "var(--card-bg)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "var(--shadow-sm)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statLabel: {
    color: "var(--text-muted)",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "8px",
  },
  statValue: {
    color: "var(--text-main)",
    fontSize: "36px",
    fontWeight: "700",
    margin: 0,
    letterSpacing: "-1px",
  },
  statSubtextDanger: {
    color: "var(--danger)",
    fontSize: "12px",
    fontWeight: "500",
    marginTop: "8px",
  },
  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "24px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sectionRight: {
     display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "var(--text-main)",
    margin: 0,
  },
  viewAll: {
    fontSize: "13px",
    color: "var(--primary)",
    textDecoration: "none",
    fontWeight: "600",
  },
  tableCard: {
    background: "var(--card-bg)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "var(--shadow-sm)",
  },
  table: {
    display: "flex",
    flexDirection: "column",
  },
  tableHeader: {
    display: "flex",
    paddingBottom: "16px",
    borderBottom: "1px solid var(--border-color)",
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid var(--border-color)",
    fontSize: "14px",
    color: "var(--text-main)",
    fontWeight: "500",
  },
  cellName: {
    flex: 2,
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatarSmall: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "var(--primary)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "600",
  },
  cell: { flex: 1 },
  cellSmall: { flex: 0.5 },
  cellRight: { flex: 0.5, textAlign: "right" },
  actionBtn: {
    color: "var(--text-muted)",
    fontSize: "13px",
    textDecoration: "none",
    fontWeight: "500",
    backgroundColor: "var(--bg-secondary)",
    padding: "6px 12px",
    borderRadius: "6px",
  },
  empty: {
    color: "var(--text-muted)",
    fontSize: "14px",
    textAlign: "center",
    padding: "20px 0",
  },
  scanItem: {
     display: "flex",
     justifyContent: "space-between",
     alignItems: "center",
     padding: "16px",
     backgroundColor: "var(--bg-color)",
     borderRadius: "12px",
  },
  scanDisease: {
     fontSize: "14px",
     fontWeight: "600",
     color: "var(--text-main)",
     marginBottom: "4px",
  },
  scanDate: {
     fontSize: "12px",
     color: "var(--text-muted)",
  },
  scanRisk: {
     backgroundColor: "var(--danger-light)",
     color: "var(--danger)",
     padding: "4px 8px",
     borderRadius: "12px",
     fontSize: "12px",
     fontWeight: "600",
  }
};