import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, verifyUser } from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState("register");
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "", role: "doctor" });
  const [verifyForm, setVerifyForm] = useState({ username: "", verification_code: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwStrength, setPwStrength] = useState(0); // 0-3

  const getPwStrength = (pw) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    return score;
  };

  const handlePasswordChange = (val) => {
    setForm({ ...form, password: val });
    setPwStrength(getPwStrength(val));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = form;
      const res = await registerUser(submitData);
      if (res.data.error) {
        setError(typeof res.data.error === "string" ? res.data.error : JSON.stringify(res.data.error));
        return;
      }
      setSuccess(res.data.message || "Registration successful! Check your email for the verification code.");
      setVerifyForm({ ...verifyForm, username: form.username });
      setStep("verify");
    } catch (err) {
      const errData = err.response?.data?.error;
      if (typeof errData === "object") {
        const messages = Object.entries(errData)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join(" | ");
        setError(messages);
      } else {
        setError(errData || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await verifyUser(verifyForm);
      if (res.data.error) { setError(res.data.error); return; }
      setSuccess("Account verified! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = ["#ef4444", "#f59e0b", "#10b981"][pwStrength - 1] || "#e2e8f0";
  const strengthLabel = ["", "Weak", "Fair", "Strong"][pwStrength] || "";

  return (
    <div style={styles.container}>
      {step === "register" ? (
        <form onSubmit={handleRegister} style={styles.card}>
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>🛡️</div>
            <div>
              <h2 style={styles.logoTitle}>GenVeda</h2>
              <p style={styles.logoSubtitle}>CLINICAL SANCTUARY</p>
            </div>
          </div>

          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Join GenVeda today</p>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username <span style={styles.hint}>(min 3 chars, must be unique)</span></label>
            <input
              id="register-username"
              style={styles.input}
              placeholder="johndoe"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              minLength={3}
              autoComplete="username"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              id="register-email"
              style={styles.input}
              type="email"
              placeholder="email@clinic.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password <span style={styles.hint}>(min 6 characters)</span></label>
            <input
              id="register-password"
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            {form.password.length > 0 && (
              <div style={styles.strengthRow}>
                <div style={styles.strengthTrack}>
                  <div style={{ ...styles.strengthFill, width: `${(pwStrength / 3) * 100}%`, backgroundColor: strengthColor }} />
                </div>
                <span style={{ ...styles.strengthLabel, color: strengthColor }}>{strengthLabel}</span>
              </div>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              id="register-confirm-password"
              style={{
                ...styles.input,
                borderColor: form.confirmPassword && form.password !== form.confirmPassword ? "var(--danger)" : "var(--border-color)"
              }}
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              autoComplete="new-password"
            />
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <span style={styles.matchError}>Passwords do not match</span>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Role</label>
            <select
              id="register-role"
              style={styles.input}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            >
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="patient">Patient</option>
            </select>
          </div>

          <button id="register-submit" type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </button>

          <p style={styles.link}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--primary)", fontWeight: "600" }}>Sign In</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerify} style={styles.card}>
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>🛡️</div>
            <div>
              <h2 style={styles.logoTitle}>GenVeda</h2>
              <p style={styles.logoSubtitle}>CLINICAL SANCTUARY</p>
            </div>
          </div>

          <h2 style={styles.title}>Verify Account</h2>
          <p style={styles.subtitle}>Enter the code sent to your email</p>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Verification Code</label>
            <input
              id="verify-code"
              style={{ ...styles.input, textAlign: "center", fontSize: "24px", letterSpacing: "12px", fontWeight: "700" }}
              placeholder="000000"
              value={verifyForm.verification_code}
              onChange={(e) => setVerifyForm({ ...verifyForm, verification_code: e.target.value })}
              maxLength={6}
              required
            />
          </div>

          <button id="verify-submit" type="submit" style={styles.button} disabled={loading}>
            {loading ? "Verifying..." : "Verify Account"}
          </button>

          <p style={{ ...styles.link, cursor: "pointer", color: "var(--primary)", fontWeight: "600" }} onClick={() => setStep("register")}>
            ← Back to Register
          </p>
        </form>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-color)", padding: "40px 20px" },
  card: { background: "var(--card-bg)", borderRadius: "20px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: "14px" },
  logoContainer: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", justifyContent: "center" },
  logoIcon: { fontSize: "24px", color: "var(--primary)", background: "var(--primary-light)", padding: "8px", borderRadius: "12px" },
  logoTitle: { color: "var(--primary)", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" },
  logoSubtitle: { color: "var(--text-muted)", fontSize: "10px", fontWeight: "600", letterSpacing: "0.5px", margin: "2px 0 0 0" },
  title: { color: "var(--text-main)", fontSize: "24px", fontWeight: "700", textAlign: "center", margin: 0 },
  subtitle: { color: "var(--text-muted)", textAlign: "center", margin: 0, fontSize: "14px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "var(--text-main)" },
  hint: { fontSize: "11px", fontWeight: "400", color: "var(--text-muted)" },
  input: { padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "14px", outline: "none", transition: "border-color 0.2s" },
  strengthRow: { display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" },
  strengthTrack: { flex: 1, height: "4px", backgroundColor: "var(--border-color)", borderRadius: "2px", overflow: "hidden" },
  strengthFill: { height: "100%", borderRadius: "2px", transition: "width 0.3s, background-color 0.3s" },
  strengthLabel: { fontSize: "11px", fontWeight: "600", minWidth: "40px" },
  matchError: { fontSize: "12px", color: "var(--danger)", fontWeight: "500" },
  button: { padding: "14px 0", borderRadius: "10px", border: "none", background: "var(--primary)", color: "#fff", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginTop: "8px" },
  error: { background: "var(--danger-light)", color: "var(--danger)", padding: "12px 16px", borderRadius: "8px", fontSize: "13px" },
  success: { background: "var(--success-light)", color: "var(--success)", padding: "12px 16px", borderRadius: "8px", fontSize: "13px" },
  link: { color: "var(--text-muted)", textAlign: "center", fontSize: "14px", marginTop: "4px" },
};
