import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../services/api";

export default function Settings() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("user_name") || "User";
  const userId = localStorage.getItem("user_id") || "Unknown";
  const userRole = localStorage.getItem("user_role") || "doctor";

  const roleLabels = { doctor: "Chief Radiologist", nurse: "Clinical Nurse", patient: "Patient" };
  const namePrefix = { doctor: "Dr.", nurse: "Nurse", patient: "" };

  const [form, setForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_role");
    navigate("/");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.new_password !== form.confirm_password) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword({
        old_password: form.old_password,
        new_password: form.new_password,
      });

      if (res.data.error) {
        setError(res.data.error);
      } else {
        setSuccess("Password updated successfully.");
        setForm({ old_password: "", new_password: "", confirm_password: "" });
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Settings & Profile</h1>
        <p style={styles.subtitle}>Manage your account details and security.</p>
      </header>

      <div style={styles.grid}>
        {/* Profile Card */}
        <div style={styles.card}>
           <h3 style={styles.cardTitle}>Profile Details</h3>
           <div style={styles.profileSection}>
             <div style={styles.avatarLarge}>{userName.charAt(0).toUpperCase()}</div>
             <div style={styles.profileInfo}>
               <p style={styles.nameLabel}>{namePrefix[userRole]} {userName}</p>
               <p style={styles.roleLabel}>{roleLabels[userRole]}</p>
               <span style={styles.badge}>ID: GV-{userId.toString().padStart(4, '0')}</span>
             </div>
           </div>
           
           <div style={styles.divider}></div>
           
           <button onClick={handleLogout} style={styles.logoutBtn}>
             Log out of GenVeda
           </button>
        </div>

        {/* Security Card */}
        <div style={styles.card}>
           <h3 style={styles.cardTitle}>Security: Change Password</h3>
           
           {error && <div style={styles.error}>{error}</div>}
           {success && <div style={styles.success}>{success}</div>}
           
           <form onSubmit={handlePasswordChange} style={styles.form}>
             <div style={styles.inputGroup}>
               <label style={styles.label}>Current Password</label>
               <input
                 type="password"
                 style={styles.input}
                 value={form.old_password}
                 onChange={(e) => setForm({ ...form, old_password: e.target.value })}
                 required
               />
             </div>
             
             <div style={styles.inputGroup}>
               <label style={styles.label}>New Password</label>
               <input
                 type="password"
                 style={styles.input}
                 value={form.new_password}
                 onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                 required
               />
             </div>
             
             <div style={styles.inputGroup}>
               <label style={styles.label}>Confirm New Password</label>
               <input
                 type="password"
                 style={styles.input}
                 value={form.confirm_password}
                 onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                 required
               />
             </div>
             
             <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
             </button>
           </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { paddingTop: "20px" },
  header: { marginBottom: "32px" },
  title: { fontSize: "28px", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px", letterSpacing: "-0.5px" },
  subtitle: { fontSize: "15px", color: "var(--text-muted)" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" },
  card: { background: "var(--card-bg)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)" },
  cardTitle: { fontSize: "18px", fontWeight: "600", color: "var(--text-main)", marginBottom: "24px" },
  
  profileSection: { display: "flex", alignItems: "center", gap: "20px" },
  avatarLarge: { width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "700" },
  profileInfo: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  nameLabel: { fontSize: "20px", fontWeight: "600", color: "var(--text-main)", margin: "0 0 4px 0" },
  roleLabel: { fontSize: "14px", color: "var(--text-muted)", margin: "0 0 8px 0" },
  badge: { backgroundColor: "var(--border-color)", color: "var(--text-muted)", fontSize: "12px", padding: "4px 10px", borderRadius: "12px", fontWeight: "600" },
  
  divider: { height: "1px", backgroundColor: "var(--border-color)", margin: "32px 0" },
  logoutBtn: { width: "100%", padding: "12px 0", borderRadius: "10px", backgroundColor: "var(--danger-light)", color: "var(--danger)", border: "none", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  
  error: { background: "var(--danger-light)", color: "var(--danger)", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" },
  success: { background: "var(--success-light)", color: "var(--success)", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" },
  
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "var(--text-main)" },
  input: { padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "14px", outline: "none" },
  submitBtn: { padding: "14px 0", borderRadius: "10px", border: "none", background: "var(--primary)", color: "#fff", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginTop: "8px" }
};
