import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        <Topbar />
        <main style={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "var(--bg-color)",
  },
  mainContent: {
    flex: 1,
    marginLeft: "260px", /* Match Sidebar width */
    display: "flex",
    flexDirection: "column",
  },
  pageContent: {
    padding: "0 40px 40px 40px",
    flex: 1,
  }
};
