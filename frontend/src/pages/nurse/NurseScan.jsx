import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createScan, getPatients } from "../../services/api";

export default function NurseScan() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [patientId, setPatientId] = useState("");
  const [patients, setPatients] = useState([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  // Camera state
  const [cameraMode, setCameraMode] = useState(null);      // null | "system" | "dermoscope"
  const [cameraActive, setCameraActive] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // Keywords that typically appear in USB/dermoscope camera labels
  const DERM_KEYWORDS = ["usb", "external", "capture", "derm", "horus", "derml", "video device", "hdmi", "obs", "cam link"];
  const isLikelyDermoscope = (label = "") =>
    DERM_KEYWORDS.some((kw) => label.toLowerCase().includes(kw));

  useEffect(() => {
    getPatients().then((res) => setPatients(res.data)).catch(() => {});
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      setAvailableCameras(devices.filter((d) => d.kind === "videoinput"));
    }).catch(() => {});

    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Attach stream to video element AFTER it renders into the DOM
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn("Video autoplay failed:", err);
      });
    }
  }, [cameraActive]);

  const startCamera = async (deviceId) => {
    stopCamera();
    setError("");
    try {
      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      setError("Camera access denied or device not found. Check browser permissions.");
    }
  };

  const handleCameraSelect = async (mode) => {
    setCameraMode(mode);
    setPreview(null);
    setImage(null);
    setError("");

    try {
      // Step 1: Request ANY camera permission so browser unlocks real device labels
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach((t) => t.stop());

      // Step 2: Re-enumerate NOW — labels will be populated after permission grant
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === "videoinput");
      setAvailableCameras(cams);

      console.log("[Camera] Detected cameras:", cams.map((c) => `${c.label} [${c.deviceId.slice(0, 8)}]`));

      if (mode === "system") {
        const sysCam = cams.find((c) => !isLikelyDermoscope(c.label)) || cams[0];
        if (!sysCam) { setError("No system camera found."); return; }
        console.log("[Camera] System camera:", sysCam.label);
        setSelectedDeviceId(sysCam.deviceId);
        startCamera(sysCam.deviceId);

      } else if (mode === "dermoscope") {
        const dermCam = cams.find((c) => isLikelyDermoscope(c.label));

        if (dermCam) {
          console.log("[Camera] Dermoscope found by label:", dermCam.label);
          setSelectedDeviceId(dermCam.deviceId);
          startCamera(dermCam.deviceId);
        } else if (cams.length > 1) {
          const lastCam = cams[cams.length - 1];
          console.log("[Camera] No label match — using last camera:", lastCam.label);
          setSelectedDeviceId(lastCam.deviceId);
          startCamera(lastCam.deviceId);
        } else {
          setError("Only one camera detected. Please connect your USB dermoscope and try again.");
          setCameraMode(null);
        }
      }
    } catch (err) {
      setError("Camera permission denied. Please allow camera access in your browser settings.");
      setCameraMode(null);
    }
  };

  const handleDeviceChange = (deviceId) => {
    setSelectedDeviceId(deviceId);
    startCamera(deviceId);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
      setError("Camera not ready yet. Please wait a moment and try again.");
      return;
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) { setError("Failed to capture frame. Try again or upload a file."); return; }
      const objectUrl = URL.createObjectURL(blob);
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      setImage(file);
      setPreview(objectUrl);
      stopCamera();
      setCameraMode(null);
    }, "image/jpeg", 0.92);
  };

  const handleImageChange = (e) => {
    stopCamera();
    setCameraMode(null);
    const file = e.target.files[0];
    setImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    if (!image || !patientId) {
      setError("Please select a patient and upload or capture an image.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("patient", patientId);
      if (notes) formData.append("notes", notes);
      await createScan(formData);
      navigate("/nurse/triage");
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <header style={s.header}>
        <h1 style={s.title}>Dermoscope Scan</h1>
        <p style={s.subtitle}>
          Capture a high-resolution dermoscope image and initialize AI analysis. Select your camera source below.
        </p>
      </header>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.grid}>
        {/* Left: Preview + Camera */}
        <div style={s.leftColumn}>
          {/* Camera Source Selector */}
          {!cameraActive && !preview && (
            <div style={s.cameraSourceCard}>
              <h3 style={s.cardTitle}>📷 Select Image Source</h3>
              <p style={s.cameraSubtitle}>Choose a camera or upload from your device</p>
              <div style={s.cameraSourceGrid}>
                <button style={s.cameraSourceBtn} onClick={() => handleCameraSelect("system")}>
                  <span style={s.cameraSourceIcon}>💻</span>
                  <span style={s.cameraSourceLabel}>System Camera</span>
                  <span style={s.cameraSourceHint}>Built-in webcam</span>
                </button>
                <button style={s.cameraSourceBtn} onClick={() => handleCameraSelect("dermoscope")}>
                  <span style={s.cameraSourceIcon}>🔬</span>
                  <span style={s.cameraSourceLabel}>Dermoscope</span>
                  <span style={s.cameraSourceHint}>USB dermatoscope</span>
                </button>
              </div>
              {availableCameras.length > 0 && (
                <div style={s.devicePickerRow}>
                  <label style={s.devicePickerLabel}>Manual device select:</label>
                  <select
                    style={s.devicePickerSelect}
                    value={selectedDeviceId}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                  >
                    <option value="">-- Select device --</option>
                    {availableCameras.map((cam, i) => {
                      const isUsb = DERM_KEYWORDS.some((kw) => (cam.label || "").toLowerCase().includes(kw));
                      const tag = isUsb ? "🔬 USB" : "💻 Built-in";
                      const label = cam.label || `Camera ${i + 1}`;
                      return (
                        <option key={cam.deviceId} value={cam.deviceId}>
                          {tag} — {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Live Camera Feed */}
          {cameraActive && (
            <div style={s.previewContainer}>
              <video ref={videoRef} style={s.video} autoPlay playsInline muted />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <div style={s.liveIndicator}>
                <span style={s.dot}></span>
                {cameraMode === "dermoscope" ? "DERMOSCOPE LIVE" : "SYSTEM CAMERA LIVE"}
              </div>
              <div style={s.cameraControls}>
                <button style={s.captureBtn} onClick={captureFrame}>⊙ Capture</button>
                <button style={s.cancelCamBtn} onClick={() => { stopCamera(); setCameraMode(null); }}>✕ Cancel</button>
              </div>
            </div>
          )}

          {/* Captured / Uploaded Preview */}
          {!cameraActive && preview && (
            <div style={s.previewContainer}>
              <img src={preview} alt="Preview" style={s.previewImage} />
              <div
                onClick={() => { setPreview(null); setImage(null); }}
                style={{ cursor: "pointer", ...s.liveIndicator, backgroundColor: "rgba(239,68,68,0.8)" }}
              >
                ✕ Remove
              </div>
            </div>
          )}

          {/* Upload Actions */}
          <div style={s.uploadActions}>
            {!cameraActive && (
              <button style={s.uploadBtnOutline} onClick={() => { setPreview(null); setImage(null); setCameraMode(null); handleCameraSelect("system"); }}>
                📷 Open Camera
              </button>
            )}
            <label style={s.uploadBtnOutline}>
              ↑ Upload File
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            </label>
          </div>
        </div>

        {/* Right: Form */}
        <div style={s.rightColumn}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Patient Details</h3>
            <div style={s.inputGroup}>
              <label style={s.label}>Select Patient</label>
              <select style={s.input} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="">-- Choose a patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (Age: {p.age})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Clinical Observations</h3>
            <textarea
              style={s.textarea}
              placeholder="Patient symptoms, dermoscope settings, observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              onClick={handleUpload}
              style={{ ...s.submitBtn, opacity: (loading || !image || !patientId) ? 0.6 : 1 }}
              disabled={loading || !image || !patientId}
            >
              {loading ? "Analyzing..." : "Initialize AI Analysis"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { paddingTop: "20px" },
  header: { marginBottom: "32px" },
  title: { fontSize: "28px", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px", letterSpacing: "-0.5px" },
  subtitle: { fontSize: "15px", color: "var(--text-muted)", maxWidth: "600px", lineHeight: "1.5" },
  error: { background: "var(--danger-light)", color: "var(--danger)", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "24px" },
  grid: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "32px", alignItems: "start" },
  leftColumn: { display: "flex", flexDirection: "column", gap: "16px" },

  cameraSourceCard: { background: "var(--card-bg)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)" },
  cardTitle: { fontSize: "16px", fontWeight: "600", color: "var(--text-main)", marginBottom: "8px" },
  cameraSubtitle: { fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" },
  cameraSourceGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" },
  cameraSourceBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
    padding: "20px 12px", borderRadius: "12px", border: "2px solid var(--border-color)",
    background: "var(--bg-secondary)", cursor: "pointer", transition: "all 0.2s",
  },
  cameraSourceIcon: { fontSize: "32px" },
  cameraSourceLabel: { fontSize: "14px", fontWeight: "700", color: "var(--text-main)" },
  cameraSourceHint: { fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" },

  devicePickerRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  devicePickerLabel: { fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", whiteSpace: "nowrap" },
  devicePickerSelect: { flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "13px", outline: "none" },

  previewContainer: { width: "100%", aspectRatio: "16/10", backgroundColor: "#1e293b", borderRadius: "16px", position: "relative", overflow: "hidden", boxShadow: "var(--shadow)" },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  previewImage: { width: "100%", height: "100%", objectFit: "cover" },
  liveIndicator: {
    position: "absolute", top: "16px", left: "16px",
    backgroundColor: "rgba(255,255,255,0.85)", padding: "6px 12px",
    borderRadius: "20px", fontSize: "12px", fontWeight: "600", color: "#334155",
    display: "flex", alignItems: "center", gap: "6px",
  },
  dot: { width: "8px", height: "8px", backgroundColor: "var(--danger)", borderRadius: "50%", boxShadow: "0 0 8px var(--danger)" },
  cameraControls: {
    position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)",
    display: "flex", gap: "12px",
  },
  captureBtn: {
    backgroundColor: "var(--primary)", color: "#fff", border: "none",
    borderRadius: "24px", padding: "10px 28px", fontSize: "15px", fontWeight: "700", cursor: "pointer",
    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
  },
  cancelCamBtn: {
    backgroundColor: "rgba(239,68,68,0.85)", color: "#fff", border: "none",
    borderRadius: "24px", padding: "10px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer",
  },

  uploadActions: { display: "flex", gap: "16px" },
  uploadBtnOutline: {
    flex: 1, backgroundColor: "var(--card-bg)", color: "var(--text-main)", textAlign: "center",
    padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer",
    border: "1px solid var(--border-color)",
  },

  rightColumn: { display: "flex", flexDirection: "column", gap: "24px" },
  card: { background: "var(--card-bg)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "500", color: "var(--text-muted)" },
  input: { padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "14px", outline: "none" },
  textarea: { width: "100%", minHeight: "120px", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-main)", fontSize: "14px", outline: "none", resize: "vertical", marginBottom: "16px" },
  submitBtn: { width: "100%", padding: "14px 0", borderRadius: "12px", border: "none", background: "var(--primary)", color: "#fff", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "opacity 0.2s" },
};
