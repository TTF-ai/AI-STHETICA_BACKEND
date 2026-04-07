import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPatients, createPatient } from "../services/api";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ name: "", age: "", gender: "", phone: "", email: "" });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await getPatients();
      setPatients(res.data);
    } catch (err) {
      setError("Failed to load patients.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addPatient = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await createPatient({
        ...form,
        age: parseInt(form.age, 10),
      });
      setForm({ name: "", age: "", gender: "", phone: "", email: "" });
      setShowForm(false);
      fetchPatients();
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

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Patients Directory</h1>
          <p style={styles.subtitle}>Manage and view all registered patients.</p>
        </div>
        <button
          style={styles.addBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "✕ Close Form" : "＋ Add Patient"}
        </button>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      {/* Add Patient Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>New Patient Registration</h3>
          <form onSubmit={addPatient} style={styles.form}>
            <div style={styles.inputGroup}>
               <label style={styles.label}>Full Name</label>
               <input
                 style={styles.input}
                 placeholder="e.g. Julian Weaver"
                 value={form.name}
                 onChange={(e) => setForm({ ...form, name: e.target.value })}
                 required
               />
            </div>
            
            <div style={{display: 'flex', gap: '16px'}}>
              <div style={styles.inputGroup}>
                 <label style={styles.label}>Age</label>
                 <input
                   style={styles.input}
                   placeholder="e.g. 54"
                   type="number"
                   value={form.age}
                   onChange={(e) => setForm({ ...form, age: e.target.value })}
                   required
                 />
              </div>
              <div style={styles.inputGroup}>
                 <label style={styles.label}>Gender</label>
                 <select
                   style={styles.input}
                   value={form.gender}
                   onChange={(e) => setForm({ ...form, gender: e.target.value })}
                   required
                 >
                   <option value="">Select Gender</option>
                   <option value="Male">Male</option>
                   <option value="Female">Female</option>
                   <option value="Other">Other</option>
                 </select>
              </div>
            </div>

            <div style={styles.inputGroup}>
               <label style={styles.label}>Phone Number</label>
               <input
                 style={styles.input}
                 placeholder="+1 (555) 000-0000"
                 value={form.phone}
                 onChange={(e) => setForm({ ...form, phone: e.target.value })}
                 required
               />
            </div>
            <div style={styles.inputGroup}>
               <label style={styles.label}>Email Address (Optional)</label>
               <input
                 style={styles.input}
                 placeholder="patient@example.com"
                 type="email"
                 value={form.email}
                 onChange={(e) => setForm({ ...form, email: e.target.value })}
               />
            </div>
            
            <button type="submit" style={styles.submitBtn}>
              Register Patient
            </button>
          </form>
        </div>
      )}

      {/* Patient List */}
      <div style={styles.tableCard}>
        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : patients.length === 0 ? (
          <p style={styles.empty}>No patients found. Add your first patient above.</p>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span style={styles.cellNameWrapper}>PATIENT NAME</span>
              <span style={styles.cellSmall}>AGE</span>
              <span style={styles.cellSmall}>GENDER</span>
              <span style={styles.cell}>PHONE</span>
              <span style={styles.cell}>EMAIL</span>
              <span style={styles.cellRight}>ACTION</span>
            </div>
            {patients.map((p) => (
              <div key={p.id} style={styles.tableRow}>
                <span style={styles.cellNameWrapper}>
                   <div style={styles.avatarSmall}>{p.name.charAt(0)}</div>
                   {p.name}
                </span>
                <span style={styles.cellSmall}>{p.age}</span>
                <span style={styles.cellSmall}>{p.gender}</span>
                <span style={styles.cell}>{p.phone}</span>
                <span style={styles.cell}>{p.email || "—"}</span>
                <span style={styles.cellRight}>
                  <Link to={`/patients/${p.id}/history`} style={styles.actionBtn}>
                    View History
                  </Link>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    paddingTop: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
  addBtn: {
    backgroundColor: "var(--primary)",
    color: "#fff",
    border: "none",
    borderRadius: "24px",
    padding: "10px 24px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  error: {
    background: "var(--danger-light)",
    color: "var(--danger)",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "24px",
  },
  formCard: {
    background: "var(--card-bg)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "var(--shadow-sm)",
    marginBottom: "32px",
    maxWidth: "600px",
  },
  formTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "var(--text-main)",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
  },
  label: {
    fontSize: "13px",
    fontWeight: "500",
    color: "var(--text-muted)",
  },
  input: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-main)",
    fontSize: "14px",
    outline: "none",
  },
  submitBtn: {
    padding: "12px 0",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "var(--primary)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
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
  cellNameWrapper: {
    flex: 2,
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatarSmall: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "var(--primary-light)",
    color: "var(--primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "600",
  },
  cell: { flex: 1 },
  cellSmall: { flex: 0.5 },
  cellRight: { flex: 1, textAlign: "right" },
  actionBtn: {
    color: "var(--primary)",
    fontSize: "13px",
    textDecoration: "none",
    fontWeight: "600",
  },
  empty: {
    color: "var(--text-muted)",
    fontSize: "14px",
    textAlign: "center",
    padding: "20px 0",
  },
};