import { useEffect, useState } from "react";
import { getPatients, getReports, createReport, createPatient } from "../../services/api";

export default function NursePatients() {
  const [patients, setPatients] = useState([]);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reportForm, setReportForm] = useState({ title: "", report_type: "general", notes: "" });
  const [reportFile, setReportFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // New variables for adding a patient
  const [patientForm, setPatientForm] = useState({ name: "", age: "", gender: "", phone: "", email: "" });
  const [showPatientForm, setShowPatientForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, rRes] = await Promise.all([getPatients(), getReports()]);
      setPatients(pRes.data);

      // Group reports by patient id
      const grouped = {};
      rRes.data.forEach((r) => {
        if (!grouped[r.patient]) grouped[r.patient] = [];
        grouped[r.patient].push(r);
      });
      setReports(grouped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedPatient) return;

    try {
      const fd = new FormData();
      fd.append("patient", selectedPatient.id);
      fd.append("title", reportForm.title);
      fd.append("report_type", reportForm.report_type);
      fd.append("notes", reportForm.notes);
      if (reportFile) fd.append("file", reportFile);

      await createReport(fd);
      setSuccess("Report uploaded successfully.");
      setReportForm({ title: "", report_type: "general", notes: "" });
      setReportFile(null);
      fetchData();
    } catch (err) {
      setError("Failed to upload report.");
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await createPatient({
        ...patientForm,
        age: parseInt(patientForm.age, 10),
      });
      setPatientForm({ name: "", age: "", gender: "", phone: "", email: "" });
      setShowPatientForm(false);
      setSuccess("Patient added successfully.");
      fetchData();
    } catch (err) {
      const errData = err.response?.data;
      if (typeof errData === "object") {
        const messages = Object.entries(errData)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join(" | ");
        setError(messages);
      } else {
        setError("Failed to add patient.");
      }
    }
  };

  const riskBadge = (zone) => {
    const colors = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };
    return {
      backgroundColor: colors[zone] + "20",
      color: colors[zone],
      padding: "4px 10px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "600",
      textTransform: "capitalize",
    };
  };

  if (loading) return <div style={s.container}><p style={{color:"var(--text-muted)"}}>Loading...</p></div>;

  return (
    <div style={s.container}>
      <header style={{...s.header, display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div>
          <h1 style={s.title}>Patient Management</h1>
          <p style={s.subtitle}>Collect reports, blood work, and clinical data for each patient.</p>
        </div>
        <button style={s.addBtn} onClick={() => setShowPatientForm(!showPatientForm)}>
          {showPatientForm ? "✕ Close Form" : "＋ Add Patient"}
        </button>
      </header>

      {error && <div style={s.error}>{error}</div>}
      {success && <div style={s.success}>{success}</div>}

      {showPatientForm && (
        <div style={{ ...s.card, marginBottom: "24px" }}>
          <h3 style={s.cardTitle}>New Patient Registration</h3>
          <form onSubmit={handleAddPatient} style={s.form}>
            <div style={s.inputGroup}>
               <label style={s.label}>Full Name</label>
               <input
                 style={s.input}
                 placeholder="e.g. Julian Weaver"
                 value={patientForm.name}
                 onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                 required
               />
            </div>
            
            <div style={{display: 'flex', gap: '16px'}}>
              <div style={s.inputGroup}>
                 <label style={s.label}>Age</label>
                 <input
                   style={s.input}
                   placeholder="e.g. 54"
                   type="number"
                   value={patientForm.age}
                   onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                   required
                 />
              </div>
              <div style={s.inputGroup}>
                 <label style={s.label}>Gender</label>
                 <select
                   style={s.input}
                   value={patientForm.gender}
                   onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                   required
                 >
                   <option value="">Select Gender</option>
                   <option value="Male">Male</option>
                   <option value="Female">Female</option>
                   <option value="Other">Other</option>
                 </select>
              </div>
            </div>

            <div style={s.inputGroup}>
               <label style={s.label}>Phone Number</label>
               <input
                 style={s.input}
                 placeholder="+1 (555) 000-0000"
                 value={patientForm.phone}
                 onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                 required
               />
            </div>
            <div style={s.inputGroup}>
               <label style={s.label}>Email Address (Optional)</label>
               <input
                 style={s.input}
                 placeholder="patient@example.com"
                 type="email"
                 value={patientForm.email}
                 onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
               />
            </div>
            
            <button type="submit" style={s.submitBtn}>
              Register Patient
            </button>
          </form>
        </div>
      )}

      <div style={s.grid}>
        {/* Patient List */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>All Patients</h3>
          {patients.length === 0 ? (
            <p style={s.empty}>No patients found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {patients.map((p) => (
                <div
                  key={p.id}
                  style={{
                    ...s.patientRow,
                    ...(selectedPatient?.id === p.id ? s.patientRowActive : {}),
                  }}
                  onClick={() => setSelectedPatient(p)}
                >
                  <div style={s.avatarSmall}>{p.name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <p style={s.patientName}>{p.name}</p>
                    <p style={s.patientMeta}>{p.age}y • {p.gender} • {p.phone}</p>
                  </div>
                  <span style={riskBadge(p.risk_zone)}>{p.risk_zone}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Selected Patient Reports */}
        <div>
          {selectedPatient ? (
            <>
              <div style={s.card}>
                <h3 style={s.cardTitle}>Reports: {selectedPatient.name}</h3>
                {(reports[selectedPatient.id] || []).length === 0 ? (
                  <p style={s.empty}>No reports yet for this patient.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {(reports[selectedPatient.id] || []).map((r) => (
                      <div key={r.id} style={s.reportItem}>
                        <div>
                          <p style={s.reportTitle}>{r.title}</p>
                          <p style={s.reportMeta}>
                            {r.report_type} • {new Date(r.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {r.file && (
                          <a href={r.file} target="_blank" rel="noreferrer" style={s.viewLink}>
                            View File
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Report Form */}
              <div style={{ ...s.card, marginTop: "24px" }}>
                <h3 style={s.cardTitle}>Upload Report</h3>
                <form onSubmit={handleAddReport} style={s.form}>
                  <div style={s.inputGroup}>
                    <label style={s.label}>Report Title</label>
                    <input
                      style={s.input}
                      placeholder="e.g. Blood Test Results"
                      value={reportForm.title}
                      onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div style={s.inputGroup}>
                    <label style={s.label}>Report Type</label>
                    <select
                      style={s.input}
                      value={reportForm.report_type}
                      onChange={(e) => setReportForm({ ...reportForm, report_type: e.target.value })}
                    >
                      <option value="general">General</option>
                      <option value="blood">Blood Report</option>
                      <option value="xray">X-Ray</option>
                      <option value="dermatology">Dermatology</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div style={s.inputGroup}>
                    <label style={s.label}>Notes</label>
                    <textarea
                      style={{ ...s.input, minHeight: "80px", resize: "vertical" }}
                      placeholder="Clinical observations..."
                      value={reportForm.notes}
                      onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                    />
                  </div>
                  <div style={s.inputGroup}>
                    <label style={s.label}>Attach File</label>
                    <input
                      type="file"
                      onChange={(e) => setReportFile(e.target.files[0])}
                      style={s.input}
                    />
                  </div>
                  <button type="submit" style={s.submitBtn}>Upload Report</button>
                </form>
              </div>
            </>
          ) : (
            <div style={s.card}>
              <p style={s.empty}>Select a patient from the list to view and upload reports.</p>
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
  addBtn: { backgroundColor: "var(--primary)", color: "#fff", border: "none", borderRadius: "24px", padding: "10px 24px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  error: { background: "var(--danger-light)", color: "var(--danger)", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" },
  success: { background: "var(--success-light)", color: "var(--success)", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" },
  card: { background: "var(--card-bg)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)" },
  cardTitle: { fontSize: "18px", fontWeight: "600", color: "var(--text-main)", marginBottom: "20px" },
  empty: { color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px 0" },
  patientRow: { display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s" },
  patientRowActive: { backgroundColor: "var(--primary-light)", border: "1px solid var(--primary)" },
  avatarSmall: { width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600" },
  patientName: { fontSize: "14px", fontWeight: "600", color: "var(--text-main)", marginBottom: "2px" },
  patientMeta: { fontSize: "12px", color: "var(--text-muted)" },
  reportItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", backgroundColor: "var(--bg-color)", borderRadius: "10px" },
  reportTitle: { fontSize: "14px", fontWeight: "600", color: "var(--text-main)", marginBottom: "4px" },
  reportMeta: { fontSize: "12px", color: "var(--text-muted)", textTransform: "capitalize" },
  viewLink: { color: "var(--primary)", fontSize: "13px", fontWeight: "600", textDecoration: "none" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "var(--text-main)" },
  input: { padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "14px", outline: "none" },
  submitBtn: { padding: "12px 0", borderRadius: "10px", border: "none", background: "var(--primary)", color: "#fff", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
};
