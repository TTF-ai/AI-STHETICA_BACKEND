import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getScans, getPatients } from "../services/api";

export default function PatientHistory() {
  const { patientId } = useParams();
  const [scans, setScans] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
       try {
          const [scansRes, patientsRes] = await Promise.all([
             getScans({ patient: patientId }),
             getPatients()
          ]);
          setScans(scansRes.data);
          
          // Find this specific patient
          const currentPatient = patientsRes.data.find(p => p.id === parseInt(patientId));
          if (currentPatient) {
             setPatientData(currentPatient);
          }
       } catch (err) {
          setError("Failed to load patient data.");
       } finally {
          setLoading(false);
       }
    }
    fetchData();
  }, [patientId]);

  if (loading) return <div style={styles.container}><p style={styles.empty}>Loading history...</p></div>;

  return (
    <div style={styles.container}>
      {/* Top Patient Header */}
      <header style={styles.header}>
         <div>
            <div style={styles.idBadge}>
               PATIENT ID: GV-{patientId.padStart(4, '0')} <span style={styles.priorityPill}>HIGH PRIORITY</span>
            </div>
            <h1 style={styles.title}>{patientData ? patientData.name : "Unknown Patient"}</h1>
            <p style={styles.subtitle}>
               🗓 Last Assessment: {scans.length > 0 ? new Date(scans[0].created_at).toLocaleDateString() : "None"} 
               &nbsp;•&nbsp; {patientData ? patientData.age : "--"} years 
               &nbsp;•&nbsp; {patientData ? patientData.gender : "--"}
            </p>
         </div>
         <div style={styles.velocityCard}>
            <div style={styles.velocityIcon}>↗</div>
            <div>
               <p style={styles.velocityLabel}>RISK VELOCITY</p>
               <p style={styles.velocityValue}>+12.4% <span style={styles.velocitySub}>vs Prev</span></p>
            </div>
         </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
         {/* Left Column: Timeline */}
         <div style={styles.leftColumn}>
            <div style={styles.timelineHeader}>
               <h3 style={styles.sectionTitle}>Scan History</h3>
               <span style={styles.countBadge}>{scans.length} Entries</span>
            </div>
            
            {scans.length === 0 ? (
               <p style={styles.empty}>No scans found for this patient.</p>
            ) : (
               <div style={styles.timeline}>
                  {scans.map((scan, index) => (
                     <div key={scan.id} style={styles.timelineItem}>
                        {/* Timeline dot and line */}
                        <div style={styles.timelineConnector}>
                           <div style={index === 0 ? styles.timelineDotActive : styles.timelineDot}>
                              {index === 0 && <div style={styles.innerDot}></div>}
                           </div>
                           {index !== scans.length - 1 && <div style={styles.timelineLine}></div>}
                        </div>
                        
                        {/* Scan Card */}
                        <div style={styles.scanCard}>
                           <div style={styles.scanCardImage}>
                              {scan.image ? (
                                 <img src={scan.image} alt="Scan" style={styles.img} />
                              ) : (
                                 <div style={styles.imgPlaceholder}>No Image</div>
                              )}
                           </div>
                           <div style={styles.scanCardContent}>
                              <div style={styles.scanCardHeader}>
                                 <p style={styles.scanDate}>
                                    {new Date(scan.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                 </p>
                                 <div style={styles.scanScoreBox}>
                                    <span style={styles.scoreLabel}>RISK SCORE</span>
                                    <span style={{
                                       ...styles.scoreValue,
                                       color: (scan.risk_score || 0) >= 67 ? "#EF5350"
                                            : (scan.risk_score || 0) >= 44 ? "#FFA726"
                                            : "#66BB6A"
                                    }}>
                                       {(scan.risk_score ?? scan.confidence ?? 0).toFixed(1)}%
                                    </span>
                                    <span style={styles.scoreOutOf}>/ 100%</span>
                                 </div>
                              </div>
                              <h4 style={styles.scanTitle}>{scan.predicted_disease}</h4>
                              <p style={styles.scanDesc}>
                                 {scan.notes || "Standard baseline assessment. AI detected conditions consistent with age-related benchmarks."}
                              </p>
                              
                              <div style={styles.scanActions}>
                                 <Link to="/insights" style={styles.viewBtn}>View Deep Analysis</Link>
                                 <button style={styles.compareBtn}>⊕ Compare</button>
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
    </div>
  );
}

const styles = {
  container: { paddingTop: "20px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "40px",
  },
  idBadge: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--primary)",
    letterSpacing: "1px",
    marginBottom: "8px",
  },
  priorityPill: {
    backgroundColor: "#f3e8ff",
    color: "#9333ea",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "10px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "var(--text-main)",
    marginBottom: "8px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-muted)",
    fontWeight: "500",
  },
  velocityCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "var(--card-bg)",
    padding: "16px 24px",
    borderRadius: "32px",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--border-color)",
  },
  velocityIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "var(--danger-light)",
    color: "#ef4444",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "bold",
  },
  velocityLabel: { fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.5px" },
  velocityValue: { fontSize: "18px", fontWeight: "700", color: "var(--text-main)", margin: 0 },
  velocitySub: { fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" },
  
  error: { background: "var(--danger-light)", color: "var(--danger)", padding: "12px", borderRadius: "8px", marginBottom: "20px" },
  empty: { color: "var(--text-muted)", fontSize: "14px", marginTop: "20px" },
  
  grid: { display: "grid", gridTemplateColumns: "1fr", gap: "24px" },
  leftColumn: { display: "flex", flexDirection: "column" },
  
  timelineHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "32px",
  },
  sectionTitle: { fontSize: "20px", fontWeight: "600", color: "var(--text-main)", margin: 0 },
  countBadge: {
    background: "var(--border-color)",
    color: "var(--text-muted)",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "16px",
  },
  
  timeline: { display: "flex", flexDirection: "column" },
  timelineItem: { display: "flex", gap: "32px", position: "relative" },
  timelineConnector: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "24px",
  },
  timelineDot: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    backgroundColor: "var(--border-color)",
    marginTop: "40px",
  },
  timelineDotActive: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "var(--card-bg)",
    border: "2px solid var(--primary)",
    marginTop: "36px",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  innerDot: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--primary)" },
  timelineLine: {
    width: "2px",
    flex: 1,
    backgroundColor: "var(--border-color)",
    marginTop: "8px",
    marginBottom: "8px",
  },
  
  scanCard: {
    flex: 1,
    display: "flex",
    gap: "24px",
    background: "var(--card-bg)",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid var(--border-color)",
    marginBottom: "24px",
  },
  scanCardImage: {
    width: "240px",
    height: "160px",
    borderRadius: "12px",
    backgroundcolor: "var(--text-main)",
    overflow: "hidden",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  imgPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: "14px" },
  
  scanCardContent: { flex: 1, display: "flex", flexDirection: "column" },
  scanCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" },
  scanDate: { fontSize: "12px", fontWeight: "700", color: "var(--primary)", letterSpacing: "1px", margin: 0 },
  scanScoreBox: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  scoreLabel: { fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.5px" },
  scoreValue: { fontSize: "24px", fontWeight: "700", color: "#66BB6A", margin: "-4px 0 0 0" },
  scoreOutOf: { fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", textAlign: "right" },
  
  scanTitle: { fontSize: "18px", fontWeight: "600", color: "var(--text-main)", marginBottom: "12px", width: "80%" },
  scanDesc: { fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.5", marginBottom: "20px" },
  
  scanActions: { display: "flex", gap: "16px", marginTop: "auto" },
  viewBtn: {
     backgroundColor: "var(--primary-light)",
     color: "var(--primary)",
     padding: "8px 16px",
     borderRadius: "20px",
     fontSize: "13px",
     fontWeight: "600",
     textDecoration: "none",
  },
  compareBtn: {
     backgroundColor: "transparent",
     border: "none",
     color: "var(--text-muted)",
     fontSize: "13px",
     fontWeight: "600",
     cursor: "pointer",
  }
};