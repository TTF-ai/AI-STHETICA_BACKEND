import { NavLink, useNavigate } from "react-router-dom";

const NAV_ITEMS = {
  doctor: [
    { to: "/dashboard", icon: "🎛️", label: "Dashboard" },
    { to: "/patients", icon: "👥", label: "Patients" },
    { to: "/scan", icon: "🔬", label: "New Scan" },
    { to: "/insights", icon: "📈", label: "Insights" },
    { to: "/settings", icon: "⚙️", label: "Settings" },
  ],
  nurse: [
    { to: "/nurse/dashboard", icon: "🎛️", label: "Dashboard" },
    { to: "/nurse/patients", icon: "👥", label: "Patients" },
    { to: "/nurse/scan", icon: "🔬", label: "Scan" },
    { to: "/nurse/triage", icon: "🔺", label: "Triage" },
    { to: "/settings", icon: "⚙️", label: "Settings" },
  ],
  patient: [
    { to: "/patient/dashboard", icon: "🏠", label: "My Dashboard" },
    { to: "/patient/appointments", icon: "📅", label: "Appointments" },
    { to: "/settings", icon: "⚙️", label: "Settings" },
  ],
};

const ROLE_LABELS = {
  doctor: "Chief Radiologist",
  nurse: "Clinical Nurse",
  patient: "Patient",
};

const NAME_PREFIX = {
  doctor: "Dr.",
  nurse: "Nurse",
  patient: "",
};

export default function Sidebar() {
  const userName = localStorage.getItem("user_name") || "User";
  const userRole = localStorage.getItem("user_role") || "doctor";
  const navigate = useNavigate();
  const items = NAV_ITEMS[userRole] || NAV_ITEMS.doctor;

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>🛡️</div>
        <div>
          <h2 style={styles.logoTitle}>GenVeda</h2>
          <p style={styles.logoSubtitle}>CLINICAL SANCTUARY</p>
        </div>
      </div>

      <nav style={styles.nav}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) =>
              isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink
            }
          >
            <span style={styles.icon}>{item.icon}</span> {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={styles.footer} onClick={() => navigate("/settings")}>
        <div style={styles.userSection}>
          <div style={styles.avatar}>{userName.charAt(0).toUpperCase()}</div>
          <div>
            <p style={styles.userName}>
              {NAME_PREFIX[userRole]} {userName}
            </p>
            <p style={styles.userRole}>{ROLE_LABELS[userRole]}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "260px",
    height: "100vh",
    backgroundColor: "var(--card-bg)",
    borderRight: "1px solid var(--primary-light)",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
  },
  logoContainer: {
    padding: "32px 24px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
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
    fontSize: "18px",
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
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "0 16px",
    flex: 1,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    color: "var(--text-muted)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "0 12px 12px 0",
    borderLeft: "4px solid transparent",
    transition: "all 0.2s",
  },
  navLinkActive: {
    color: "var(--primary)",
    backgroundColor: "var(--primary-light)",
    borderLeft: "4px solid var(--primary)",
    fontWeight: "600",
  },
  icon: {
    fontSize: "18px",
  },
  footer: {
    padding: "24px 16px",
    borderTop: "1px solid var(--primary-light)",
    cursor: "pointer",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "var(--primary-light)",
    color: "var(--primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "16px",
  },
  userName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-main)",
  },
  userRole: {
    fontSize: "12px",
    color: "var(--text-muted)",
  },
};
