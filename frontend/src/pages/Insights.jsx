import { useEffect, useState, useRef } from "react";
import { getScans, createPrescription } from "../services/api";

// ── Constants matching risk_report.py ──────────────────────────────────────
const CLASSES = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"];
const CLASS_FULL = {
  akiec: "Actinic Keratosis", bcc: "Basal Cell Carcinoma",
  bkl: "Benign Keratosis", df: "Dermatofibroma",
  mel: "Melanoma", nv: "Melanocytic Nevus", vasc: "Vascular Lesion",
};
const CLASS_COLORS = {
  mel: "#EF5350", bcc: "#FFA726", akiec: "#FFCA28",
  bkl: "#66BB6A", nv: "#42A5F5", df: "#26C6DA", vasc: "#AB47BC",
};
const ABCDE_DATA = {
  mel:   { A: true,  B: true,  C: true,  D: true,  E: true  },
  bcc:   { A: false, B: true,  C: true,  D: false, E: true  },
  akiec: { A: false, B: false, C: true,  D: false, E: true  },
  bkl:   { A: true,  B: true,  C: true,  D: false, E: false },
  nv:    { A: true,  B: true,  C: false, D: false, E: false },
  df:    { A: false, B: false, C: true,  D: false, E: false },
  vasc:  { A: false, B: true,  C: true,  D: false, E: false },
};
const ABCDE_LABELS = {
  A: "Asymmetry", B: "Border irregularity",
  C: "Color variation", D: "Diameter > 6mm", E: "Evolution / change",
};
const MONITORING = {
  HIGH:   { urgency: "Immediate", timeline: "< 1 week", steps: ["Book urgent dermatologist appointment", "Request dermoscopy + biopsy evaluation", "Avoid sun exposure to the lesion", "Document lesion size and changes"] },
  MEDIUM: { urgency: "Short-term", timeline: "1–2 weeks", steps: ["Schedule dermatologist within 1–2 weeks", "Monitor lesion for any visible change", "Photograph lesion for follow-up comparison", "Apply SPF 50+ sunscreen to area"] },
  LOW:    { urgency: "Routine", timeline: "6–12 months", steps: ["Perform monthly ABCDE self-check", "Annual skin cancer screening", "Apply sunscreen regularly", "Revisit if any new change is noticed"] },
};

// ── SVG Risk Gauge ──────────────────────────────────────────────────────────
function RiskGauge({ score }) {
  const r = 70;
  const cx = 90, cy = 90;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const arcPath = (startDeg, endDeg) => {
    const s = toRad(startDeg), e = toRad(endDeg);
    const x1 = cx + r * Math.cos(s), y1 = cy - r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy - r * Math.sin(e);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2}`;
  };

  const needleAngle = 180 - (score / 100) * 180;
  const needleRad = toRad(needleAngle);
  const nx = cx + 58 * Math.cos(needleRad), ny = cy - 58 * Math.sin(needleRad);

  const riskColor = score >= 67 ? "#EF5350" : score >= 44 ? "#FFA726" : "#66BB6A";
  const riskLabel = score >= 67 ? "HIGH RISK" : score >= 44 ? "MEDIUM RISK" : "LOW RISK";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <svg width="180" height="110" viewBox="0 0 180 110">
        {/* Track */}
        <path d={arcPath(180, 0)} fill="none" stroke="var(--border-color)" strokeWidth="16" />
        {/* LOW zone */}
        <path d={arcPath(180, 120)} fill="none" stroke="#66BB6A" strokeWidth="16" strokeLinecap="butt" />
        {/* MEDIUM zone */}
        <path d={arcPath(120, 60)} fill="none" stroke="#FFA726" strokeWidth="16" strokeLinecap="butt" />
        {/* HIGH zone */}
        <path d={arcPath(60, 0)} fill="none" stroke="#EF5350" strokeWidth="16" strokeLinecap="butt" />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--text-main)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="var(--text-main)" />
        {/* Score text */}
        <text x={cx} y={cy + 22} textAnchor="middle" fontSize="20" fontWeight="700" fill={riskColor}>{score.toFixed(0)}</text>
        <text x={cx} y={cy + 35} textAnchor="middle" fontSize="7" fill="var(--text-muted)">/ 100</text>
        {/* Zone labels */}
        <text x="22" y="85" fontSize="7" fontWeight="700" fill="#66BB6A">LOW</text>
        <text x="75" y="22" fontSize="7" fontWeight="700" fill="#FFA726">MED</text>
        <text x="145" y="85" fontSize="7" fontWeight="700" fill="#EF5350">HIGH</text>
      </svg>
      <span style={{ fontSize: "13px", fontWeight: "700", color: riskColor, letterSpacing: "0.5px" }}>{riskLabel}</span>
    </div>
  );
}

export default function Insights() {
  const [scans, setScans] = useState([]);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [prescriptionStatus, setPrescriptionStatus] = useState("");
  const recognitionRef = useRef(null);

  const lastResult = JSON.parse(localStorage.getItem("lastResult") || "null");

  useEffect(() => {
    getScans().then((res) => setScans(res.data)).catch(() => {});

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";
      rec.onresult = (e) => {
        let t = "";
        for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript + " ";
        setPrescriptionText((p) => p + t);
      };
      rec.onend = () => setIsRecording(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return alert("Speech recognition not supported in your browser.");
    if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); }
    else { recognitionRef.current.start(); setIsRecording(true); }
  };

  const handleSavePrescription = async () => {
    if (!lastResult?.patient) { setPrescriptionStatus("No patient linked to last scan."); return; }
    if (!prescriptionText.trim()) { setPrescriptionStatus("Prescription text is empty."); return; }
    setPrescriptionStatus("Saving...");
    try {
      await createPrescription({ patient: lastResult.patient, text: prescriptionText });
      setPrescriptionStatus("Saved successfully!");
      setTimeout(() => setPrescriptionStatus(""), 3000);
      setPrescriptionText("");
    } catch { setPrescriptionStatus("Failed to save prescription."); }
  };

  const totalScans = scans.length;
  const avgConfidence = totalScans > 0
    ? scans.reduce((sum, s) => sum + (s.confidence || 0), 0) / totalScans
    : 0;
  const diseaseDistribution = scans.reduce((acc, s) => {
    acc[s.predicted_disease] = (acc[s.predicted_disease] || 0) + 1;
    return acc;
  }, {});

  // Extract rich data from lastResult
  // all_probs is stored as percentages (0-100) e.g. {nv: 72.4, mel: 5.1, ...}
  const riskScore = lastResult?.risk_score ?? 0;
  const riskCategory = lastResult?.risk_category ?? "LOW";
  const allProbs = lastResult?.all_probs ?? {};
  // predClass = class with highest probability
  const predClass = Object.keys(allProbs).length > 0
    ? Object.entries(allProbs).reduce((a, b) => a[1] > b[1] ? a : b)[0]
    : "nv";
  const abcdeFlags = ABCDE_DATA[predClass] ?? {};
  const monitoring = MONITORING[riskCategory] ?? MONITORING.LOW;
  const riskColor = { HIGH: "#EF5350", MEDIUM: "#FFA726", LOW: "#66BB6A" }[riskCategory];

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div>
          <p style={s.breadcrumb}>ANALYSIS / LATEST SCAN</p>
          <h1 style={s.title}>Diagnostic Insights</h1>
        </div>
        <div style={s.actions}>
          <button style={s.btnOutline}>Refer Patient</button>
          <button style={s.btnPrimary}>Save Results</button>
        </div>
      </header>

      <div style={s.grid}>
        {/* LEFT: Scan image + scans table */}
        <div style={s.leftColumn}>
          {lastResult ? (
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>AI Visualization: Scan Result</h3>
                <div style={s.pills}><span style={s.pillActive}>PROBABILITY MAPPING</span></div>
              </div>
              <div style={s.visualizationArea}>
                <div style={s.heatmapPlaceholder}>
                  {lastResult.image
                    ? <img src={lastResult.image} alt="Scan" style={s.scanImg} />
                    : <div style={{ color: "rgba(255,255,255,0.7)" }}>Scan Image</div>}
                </div>
                <div style={s.resultBanner}>
                  <span style={s.bannerText}>Anomaly: {lastResult.predicted_disease || "Unknown"}</span>
                  <span style={s.bannerNotes}>{lastResult.notes || "No notes."}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={s.card}><p style={s.empty}>No recent scan results found locally.</p></div>
          )}

          {/* Per-class probability bars from lastResult */}
          {Object.keys(allProbs).length > 0 && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>Class Probability Distribution</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                {CLASSES.map((cls) => {
                  // all_probs values are already in percentage (0-100)
                  const pct = allProbs[cls] ?? 0;
                  const col = CLASS_COLORS[cls];
                  return (
                    <div key={cls}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: cls === predClass ? "700" : "500", color: cls === predClass ? col : "var(--text-main)" }}>
                          {CLASS_FULL[cls]}
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: col }}>{pct.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: "6px", backgroundColor: "var(--border-color)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", backgroundColor: col, borderRadius: "3px", transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All scans table */}
          {scans.length > 0 && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>Global Scans Record</h3>
              <div style={s.table}>
                <div style={s.tableHeader}>
                  <span style={s.cell}>DISEASE</span>
                  <span style={s.cellSmall}>CONFIDENCE</span>
                  <span style={s.cell}>DATE</span>
                </div>
                {scans.slice(0, 5).map((sc) => (
                  <div key={sc.id} style={s.tableRow}>
                    <span style={s.cell}>{sc.predicted_disease}</span>
                    <span style={s.cellSmall}>{sc.confidence.toFixed(1)}%</span>
                    <span style={s.cell}>{new Date(sc.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Risk dashboard */}
        <div style={s.rightColumn}>
          {/* Risk Gauge */}
          <div style={s.card}>
            <h3 style={s.cardTitleCenter}>RISK SCORE GAUGE</h3>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <RiskGauge score={Math.min(100, Math.max(0, riskScore > 0 ? riskScore : avgConfidence))} />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              {["LOW", "MEDIUM", "HIGH"].map((cat) => {
                const c = { LOW: "#66BB6A", MEDIUM: "#FFA726", HIGH: "#EF5350" }[cat];
                return (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "10px", height: "10px", backgroundColor: c, borderRadius: "2px" }} />
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600" }}>{cat}</span>
                  </div>
                );
              })}
            </div>
            <p style={s.scoreDesc}>
              {riskScore > 0 ? `Weighted risk score from AI analysis. Category: ${riskCategory}.` : "Overall average AI confidence across all scans."}
            </p>
          </div>

          {/* ABCDE Checklist */}
          {Object.keys(abcdeFlags).length > 0 && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>ABCDE Dermatology Checklist</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                {Object.entries(ABCDE_LABELS).map(([letter, desc]) => {
                  const present = abcdeFlags[letter] ?? false;
                  return (
                    <div key={letter} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "6px", flexShrink: 0,
                        backgroundColor: present ? "#EF5350" : "var(--border-color)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: "700", color: "#fff",
                      }}>{letter}</div>
                      <span style={{ fontSize: "13px", flex: 1, color: "var(--text-main)" }}>{desc}</span>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: present ? "#EF5350" : "#66BB6A" }}>
                        {present ? "YES ✗" : "NO ✓"}
                      </span>
                    </div>
                  );
                })}
                <p style={{ fontSize: "12px", color: riskColor, fontWeight: "600", textAlign: "center", marginTop: "4px" }}>
                  {Object.values(abcdeFlags).filter(Boolean).length}/5 risk criteria present
                </p>
              </div>
            </div>
          )}

          {/* Monitoring & Action Plan */}
          {riskScore > 0 && (
            <div style={{ ...s.card, borderLeft: `4px solid ${riskColor}` }}>
              <h3 style={s.cardTitle}>Monitoring & Action Plan</h3>
              <div style={{ backgroundColor: riskColor + "18", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: riskColor }}>{riskCategory} — {monitoring.urgency} Action</span>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>Follow-up: {monitoring.timeline}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {monitoring.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ minWidth: "20px", height: "20px", backgroundColor: riskColor + "30", color: riskColor, borderRadius: "50%", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.4" }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disease Distribution */}
          {Object.keys(diseaseDistribution).length > 0 && (
            <div style={s.card}>
              <h3 style={s.cardTitleCenter}>DISEASE DISTRIBUTION</h3>
              <div style={s.distList}>
                {Object.entries(diseaseDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([disease, count]) => (
                    <div key={disease} style={s.distItem}>
                      <div style={s.distHeader}>
                        <span style={s.distName}>{disease}</span>
                        <span style={s.distCount}>{count} cases</span>
                      </div>
                      <div style={s.barBg}>
                        <div style={{ ...s.barFill, width: `${(count / totalScans) * 100}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Voice Prescription */}
          <div style={{ ...s.card, border: isRecording ? "2px solid var(--danger)" : "none" }}>
            <h3 style={s.cardTitle}>🎤 Voice Prescription</h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
              Dictate prescription or clinical notes for the patient.
            </p>
            <textarea
              style={s.prescriptionTextarea}
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
              placeholder="Click the microphone to start dictating..."
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button onClick={toggleRecording} style={isRecording ? s.btnRecordingActive : s.btnMic}>
                {isRecording ? "⏹ Stop Recording" : "🎤 Start Dictation"}
              </button>
              <button onClick={handleSavePrescription} style={s.btnPrimarySmall}>Save Record</button>
            </div>
            {prescriptionStatus && <p style={{ marginTop: "10px", fontSize: "13px", color: "var(--primary)" }}>{prescriptionStatus}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { paddingTop: "20px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" },
  breadcrumb: { fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px" },
  title: { fontSize: "28px", fontWeight: "700", color: "var(--text-main)", letterSpacing: "-0.5px" },
  actions: { display: "flex", gap: "12px" },
  btnOutline: { color: "var(--primary)", border: "1px solid var(--primary-light)", borderRadius: "20px", padding: "8px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer", backgroundColor: "var(--bg-secondary)" },
  btnPrimary: { backgroundColor: "var(--primary)", color: "#fff", border: "none", borderRadius: "20px", padding: "8px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", alignItems: "start" },
  leftColumn: { display: "flex", flexDirection: "column", gap: "24px" },
  rightColumn: { display: "flex", flexDirection: "column", gap: "24px" },
  card: { background: "var(--card-bg)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  cardTitle: { fontSize: "15px", fontWeight: "600", color: "var(--text-main)", marginBottom: "0" },
  cardTitleCenter: { fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "1px", textAlign: "center", marginBottom: "16px" },
  pills: { display: "flex", gap: "8px" },
  pillActive: { backgroundColor: "var(--primary)", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "4px 10px", borderRadius: "12px", letterSpacing: "0.5px" },
  visualizationArea: { position: "relative", borderRadius: "12px", overflow: "hidden", boxShadow: "var(--shadow-sm)" },
  heatmapPlaceholder: { width: "100%", aspectRatio: "16/10", backgroundColor: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" },
  scanImg: { width: "100%", height: "100%", objectFit: "cover" },
  resultBanner: { position: "absolute", bottom: "16px", left: "16px", right: "16px", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  bannerText: { color: "#fff", fontSize: "13px", fontWeight: "600" },
  bannerNotes: { color: "rgba(255,255,255,0.7)", fontSize: "11px" },
  scoreDesc: { textAlign: "center", fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.5", padding: "0 8px", marginTop: "8px" },
  distList: { display: "flex", flexDirection: "column", gap: "14px" },
  distItem: { display: "flex", flexDirection: "column", gap: "6px" },
  distHeader: { display: "flex", justifyContent: "space-between" },
  distName: { fontSize: "13px", fontWeight: "600", color: "var(--text-main)" },
  distCount: { fontSize: "12px", fontWeight: "600", color: "var(--danger)" },
  barBg: { width: "100%", height: "6px", backgroundColor: "var(--border-color)", borderRadius: "3px" },
  barFill: { height: "100%", backgroundColor: "var(--danger)", borderRadius: "3px" },
  empty: { color: "var(--text-muted)", fontSize: "14px" },
  table: { display: "flex", flexDirection: "column" },
  tableHeader: { display: "flex", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)", fontSize: "11px", fontWeight: "600", color: "var(--text-muted)" },
  tableRow: { display: "flex", padding: "12px 0", borderBottom: "1px solid var(--border-color)", fontSize: "13px", color: "var(--text-main)", fontWeight: "500" },
  cell: { flex: 1 },
  cellSmall: { flex: 0.5 },
  btnPrimarySmall: { backgroundColor: "var(--primary)", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", flex: 1 },
  btnMic: { backgroundColor: "var(--bg-secondary)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", flex: 1 },
  btnRecordingActive: { backgroundColor: "var(--danger-light)", color: "var(--danger)", border: "1px solid var(--danger)", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer", flex: 1, animation: "pulse 1.5s infinite" },
  prescriptionTextarea: { width: "100%", minHeight: "90px", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "14px", resize: "vertical", outline: "none" },
};