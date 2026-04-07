# AI-Sthetica (GenVeda) - Frontend Interface

The frontend application for AI-Sthetica is a premium clinical dashboard built specifically to display AI-powered dermatological analysis to clinical staff. Designed with a dark, modern aesthetic for low eye-strain in medical environments, it features precise SVG-based risk visualizations, live multi-camera feeds, and dual-role specific dashboards (Nurse/Triage vs. Doctor/Insights).

## 🚀 Key Features

- **Clinical UI Identity:** Smooth dark mode layouts, high-fidelity SVG risk gauge visualizers, and interactive probability distribution distributions. 
- **Roles & Workflows:**
  - **Nurse Dashboard:** Allows patient segregation, "Triage Risk Zone" tracking, and high-speed patient intake workflow.
  - **Doctor Dashboard:** Offers detailed chronological patient scanning history and actionable AI diagnostic insights.
- **Hardware Integration (`NewScan` & `NurseScan`):**
  - Uses `navigator.mediaDevices` to automatically enumerate and toggle between system webcams and USB-connected external Dermoscopes.
  - Live capture workflow built in with error validation and safe fallback logic.
- **Real-time AI Metrics:** Connects cleanly to the backend to seamlessly render multi-class diagnosis breakdowns and 0-100% computed risk scores.

## 🛠 Tech Stack

- **Framework:** React.js (via Create React App)
- **Routing:** React Router v7
- **Styling:** Vanilla CSS (App.css / index.css) + modern CSS-in-JS object styling
- **API Communication:** Axios API wrapper mapping out `/api/scans/`, `/api/patients/`, etc.

## 📂 Architecture overview

- `src/pages/`: Contains the primary views including:
  - `Landing.jsx` / `Login.jsx` / `Register.jsx`
  - `Dashboard.jsx`, `Insights.jsx`, `NewScan.jsx`, `PatientHistory.jsx` (Doctor workflows)
  - `nurse/`: Specialized nurse workflows (`NurseDashboard.jsx`, `NurseScan.jsx`, `NurseTriage.jsx`)
- `src/services/api.js`: The central Axios instance controlling request logic with the backend, including Multi-part form data processing for image blobs.
- `src/components/`: Reusable widgets like `Sidebar.jsx`, `Notification.jsx`.

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TTF-ai/AI-STHETICA_FRONTEND.git
   cd AI-STHETICA_FRONTEND
   ```

2. **Install Node Dependencies:**
   Ensure you have Node.js installed, then install packages:
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm start
   ```
   *The UI will launch on `http://localhost:3000/`. To test API functionality, ensure the Django backend is also running on port `8000`.*
