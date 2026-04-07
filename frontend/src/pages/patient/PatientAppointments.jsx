import { useEffect, useState } from "react";
import { getAppointments, createAppointment, getPatients } from "../../services/api";

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date_time: "", notes: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [myPatientId, setMyPatientId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [aRes, pRes] = await Promise.all([getAppointments(), getPatients()]);
      setAppointments(aRes.data);

      // Get the patient record linked to the current user
      if (pRes.data.length > 0) {
        setMyPatientId(pRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!myPatientId) {
      setError("No linked patient record found. Please contact admin.");
      return;
    }

    setSubmitting(true);
    try {
      // Patient requests appointment — doctor will be assigned by admin/system
      // For now, use the user field of Patient as a placeholder doctor
      await createAppointment({
        patient: myPatientId,
        doctor: 1, // Will be overridden or assigned by nurse
        scheduled_by: "patient",
        date_time: form.date_time,
        status: "pending",
        notes: form.notes,
      });
      setSuccess("Appointment requested. You'll be notified when confirmed.");
      setForm({ date_time: "", notes: "" });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError("Failed to request appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={s.container}><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div>
          <h1 style={s.title}>My Appointments</h1>
          <p style={s.subtitle}>View appointments scheduled by your doctor or request a new one.</p>
        </div>
        <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ Close" : "＋ Request Appointment"}
        </button>
      </header>

      {error && <div style={s.error}>{error}</div>}
      {success && <div style={s.success}>{success}</div>}

      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>Request New Appointment</h3>
          <form onSubmit={handleRequest} style={s.form}>
            <div style={s.inputGroup}>
              <label style={s.label}>Preferred Date & Time</label>
              <input
                type="datetime-local"
                style={s.input}
                value={form.date_time}
                onChange={(e) => setForm({ ...form, date_time: e.target.value })}
                required
              />
            </div>
            <div style={s.inputGroup}>
              <label style={s.label}>Notes (optional)</label>
              <textarea
                style={{ ...s.input, minHeight: "80px", resize: "vertical" }}
                placeholder="Describe your symptoms or reason..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <button type="submit" style={s.submitBtn} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>
      )}

      <div style={s.card}>
        {appointments.length === 0 ? (
          <p style={s.empty}>No appointments found.</p>
        ) : (
          <div style={s.table}>
            <div style={s.tableHeader}>
              <span style={s.cell}>DOCTOR</span>
              <span style={s.cell}>DATE & TIME</span>
              <span style={s.cellSmall}>SCHEDULED BY</span>
              <span style={s.cellSmall}>STATUS</span>
            </div>
            {appointments.map((a) => (
              <div key={a.id} style={s.tableRow}>
                <span style={s.cell}>Dr. {a.doctor_name}</span>
                <span style={s.cell}>{new Date(a.date_time).toLocaleString()}</span>
                <span style={{ ...s.cellSmall, textTransform: "capitalize" }}>{a.scheduled_by}</span>
                <span style={s.cellSmall}>
                  <span style={s.statusBadge(a.status)}>{a.status}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  container: { paddingTop: "20px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" },
  title: { fontSize: "28px", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px", letterSpacing: "-0.5px" },
  subtitle: { fontSize: "15px", color: "var(--text-muted)" },
  addBtn: { backgroundColor: "var(--primary)", color: "#fff", border: "none", borderRadius: "24px", padding: "10px 24px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  error: { background: "var(--danger-light)", color: "var(--danger)", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" },
  success: { background: "var(--success-light)", color: "var(--success)", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" },
  formCard: { background: "var(--card-bg)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)", marginBottom: "32px", maxWidth: "500px" },
  formTitle: { fontSize: "18px", fontWeight: "600", color: "var(--text-main)", marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "var(--text-main)" },
  input: { padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "14px", outline: "none" },
  submitBtn: { padding: "12px 0", borderRadius: "10px", border: "none", background: "var(--primary)", color: "#fff", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
  card: { background: "var(--card-bg)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)" },
  empty: { color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px 0" },
  table: { display: "flex", flexDirection: "column" },
  tableHeader: { display: "flex", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)", fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" },
  tableRow: { display: "flex", alignItems: "center", padding: "16px 0", borderBottom: "1px solid var(--border-color)", fontSize: "14px", color: "var(--text-main)", fontWeight: "500" },
  cell: { flex: 1 },
  cellSmall: { flex: 0.6 },
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
