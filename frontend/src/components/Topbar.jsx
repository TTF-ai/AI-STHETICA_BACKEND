import { useState, useEffect } from "react";

export default function Topbar() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <header style={styles.topbar}>
      <div style={{ flex: 1 }}></div>
      <button onClick={toggleTheme} style={styles.themeBtn}>
        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
      </button>
    </header>
  );
}

const styles = {
  topbar: {
    height: "72px",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 40px",
  },
  themeBtn: {
    backgroundColor: "var(--card-bg)",
    color: "var(--text-main)",
    border: "1px solid var(--primary-light)",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
    transition: "all 0.2s"
  }
};
