import { useEffect, useState } from "react";
import { getPatients, getScans, triagePatient, createAppointment, getDoctors } from "../../services/api";

export default function NurseTriage() {
  const [patients, setPatients] = useState([]);
  const [scans, setScans] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, sRes, dRes] = await Promise.all([getPatients(), getScans(), getDoctors()]);
      setPatients(pRes.data);
      setScans(sRes.data);
      setDoctors(dRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPatientScans = (patientId) => scans.filter((s) => s.patient === patientId);

  const getAvgConfidence = (patientId) => {
    const ps = getPatientScans(patientId);
    if (ps.length === 0) return 0;
    // Use risk_score directly (which is 0-100), or fallback to confidence if missing
    return ps.reduce((sum, s) => sum + (s.risk_score ?? s.confidence ?? 0), 0) / ps.length;
  };

  const handleZoneChange = async (patientId, zone) => {
    setSaving((prev) => ({ ...prev, [patientId]: true }));
    setError("");
    setSuccess("");
    try {
      await triagePatient(patientId, { risk_zone: zone });
      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? { ...p, risk_zone: zone } : p))
      );
      setSuccess(`Risk zone updated for patient.`);
    } catch (err) {
      setError("Failed to update risk zone.");
    } finally {
      setSaving((prev) => ({ ...prev, [patientId]: false }));
    }
  };

  const handleSendToDoctor = async (patient) => {
    setError("");
    setSuccess("");
    const doctorId = selectedDoctor[patient.id] || (doctors[0] ? doctors[0].id : null);
    
    if (!doctorId) {
      setError("No doctors available.");
      return;
    }
    
    try {
      await createAppointment({
        patient: patient.id,
        doctor: doctorId,
        scheduled_by: "patient", // Using patient since nurse is acting for them
        date_time: new Date(Date.now() + 86400000).toISOString(), // default to tomorrow
        status: "pending",
        notes: `Triage referral: ${patient.risk_zone} risk zone`,
      });
      setSuccess(`Appointment request sent for ${patient.name}.`);
    } catch (err) {
      setError("Failed to create appointment.");
    }
  };

  const riskColors = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };

  if (loading) return <div style={s.container}><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;

  return (
    <div style={s.container}>
      <header style={s.header}>
        <h1 style={s.title}>Patient Triage</h1>
        <p style={s.subtitle}>Segregate patients into risk zones and refer high-priority cases to the doctor.</p>
      </header>

      {error && <div style={s.error}>{error}</div>}
      {success && <div style={s.success}>{success}</div>}

      <div style={s.card}>
        {patients.length === 0 ? (
          <p style={s.empty}>No patients to triage.</p>
        ) : (
          <div style={s.table}>
            <div style={s.tableHeader}>
              <span style={{ ...s.cell, flex: 2 }}>PATIENT</span>
              <span style={s.cell}>SCANS</span>
              <span style={s.cell}>AVG RISK SCORE</span>
              <span style={s.cell}>RISK ZONE</span>
              <span style={s.cell}>ACTION</span>
            </div>
            {patients.map((p) => {
              const avgConf = getAvgConfidence(p.id);
              const scanCount = getPatientScans(p.id).length;
              return (
                <div key={p.id} style={s.tableRow}>
                  <span style={{ ...s.cell, flex: 2, display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={s.avatarSmall}>{p.name.charAt(0)}</div>
                    <div>
                      <p style={s.patientName}>{p.name}</p>
                      <p style={s.patientMeta}>{p.age}y • {p.gender}</p>
                    </div>
                  </span>
                  <span style={s.cell}>{scanCount}</span>
                  <span style={s.cell}>
                    <span style={{ color: avgConf >= 70 ? "#ef4444" : avgConf >= 40 ? "#f59e0b" : "#10b981", fontWeight: "600" }}>
                      {avgConf.toFixed(1)}%
                    </span>
                  </span>
                  <span style={s.cell}>
                    <select
                      value={p.risk_zone}
                      onChange={(e) => handleZoneChange(p.id, e.target.value)}
                      disabled={saving[p.id]}
                      style={{
                        ...s.zoneSelect,
                        borderColor: riskColors[p.risk_zone],
                        color: riskColors[p.risk_zone],
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </span>
                  <span style={s.cell}>
                    {(p.risk_zone === "high" || p.risk_zone === "medium") && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {doctors.length > 0 && (
                          <select 
                            style={s.doctorSelect} 
                            value={selectedDoctor[p.id] || doctors[0].id}
                            onChange={(e) => setSelectedDoctor({ ...selectedDoctor, [p.id]: e.target.value })}
                          >
                            {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.username}</option>)}
                          </select>
                        )}
                        <button style={s.referBtn} onClick={() => handleSendToDoctor(p)}>
                          Send to Doctor
                        </button>
                      </div>
                    )}
                  </span>
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
  error: { background: "var(--danger-light)", color: "var(--danger)", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" },
  success: { background: "var(--success-light)", color: "var(--success)", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" },
  card: { background: "var(--card-bg)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)" },
  empty: { color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px 0" },
  table: { display: "flex", flexDirection: "column" },
  tableHeader: { display: "flex", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)", fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px", alignItems: "center" },
  tableRow: { display: "flex", alignItems: "center", padding: "16px 0", borderBottom: "1px solid var(--border-color)", fontSize: "14px", color: "var(--text-main)", fontWeight: "500" },
  cell: { flex: 1 },
  avatarSmall: { width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600" },
  patientName: { fontSize: "14px", fontWeight: "600", color: "var(--text-main)", marginBottom: "2px" },
  patientMeta: { fontSize: "12px", color: "var(--text-muted)" },
  zoneSelect: { padding: "6px 12px", borderRadius: "8px", border: "2px solid", fontSize: "13px", fontWeight: "600", backgroundColor: "#var(--card-bg)", cursor: "pointer", outline: "none", textTransform: "capitalize" },
  referBtn: { backgroundColor: "var(--primary)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  doctorSelect: { padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "12px" }
};
