import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser(form);

      if (res.data.error) {
        setError(res.data.error);
        return;
      }

      const { access, refresh, user_name, user_id, role } = res.data.data;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user_name", user_name);
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("user_role", role);

      // Redirect based on role
      if (role === 'nurse') navigate('/nurse/dashboard');
      else if (role === 'patient') navigate('/patient/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.card}>
        <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>🛡️</div>
            <div>
              <h2 style={styles.logoTitle}>GenVeda</h2>
              <p style={styles.logoSubtitle}>CLINICAL SANCTUARY</p>
            </div>
        </div>

        <h2 style={styles.title}>Sign In</h2>
        <p style={styles.subtitle}>Welcome back to your dashboard</p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              id="login-username"
              style={styles.input}
              placeholder="Enter your username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
        </div>
        
        <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              id="login-password"
              style={styles.input}
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
        </div>

        <button id="login-submit" type="submit" style={styles.button} disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p style={styles.link}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--primary)", fontWeight: "600" }}>
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-color)",
  },
  card: {
    background: "var(--card-bg)",
    borderRadius: "20px",
    padding: "40px",
    width: "400px",
    boxShadow: "var(--shadow)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    justifyContent: "center",
  },
  logoIcon: {
    fontSize: "24px",
    color: "var(--primary)",
    background: "var(--primary-light)",
    padding: "8px",
    borderRadius: "12px",
  },
  logoTitle: {
    color: "var(--primary)",
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  logoSubtitle: {
    color: "var(--text-muted)",
    fontSize: "10px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    margin: "2px 0 0 0",
  },
  title: {
    color: "var(--text-main)",
    fontSize: "24px",
    fontWeight: "700",
    textAlign: "center",
    margin: 0,
  },
  subtitle: {
    color: "var(--text-muted)",
    textAlign: "center",
    margin: 0,
    fontSize: "14px",
  },
  inputGroup: {
     display: "flex", flexDirection: "column", gap: "6px"
  },
  label: { fontSize: "13px", fontWeight: "600", color: "var(--text-main)" },
  input: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-main)",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    padding: "14px 0",
    borderRadius: "10px",
    border: "none",
    background: "var(--primary)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },
  error: {
    background: "var(--danger-light)",
    color: "var(--danger)",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "13px",
  },
  link: {
    color: "var(--text-muted)",
    textAlign: "center",
    fontSize: "14px",
    marginTop: "8px",
  },
};