# AI-Sthetica (GenVeda) - Backend

The AI-Sthetica backend serves as the core pipeline for intelligent dermatological analysis and clinical triage. Built with Django REST Framework and powered by TensorFlow/Keras, it evaluates skin lesion images using a MobileNetV2 architecture trained on the HAM10000 dataset to detect 7 distinct forms of skin diseases and calculate comprehensive risk metrics.

## 🚀 Features

- **AI Inference Engine:** Integrates a custom MobileNetV2 skin disease classification model (`predict_lesion`).
- **Risk Calculation:** Computes weighted clinical risk scores (`0-100%`) to prioritize high-risk patients (e.g., Melanoma).
- **Multi-Role API:** Secure API endpoints tailored for distinct clinical roles:
  - **Nurse / Triage:** Endpoints for patient creation, scan logging (via System Camera or USB Dermoscope), and risk zone segregation.
  - **Doctor:** Deep insights, patient history aggregation, and diagnostic review.
- **Explainable AI (XAI) Ready:** Infrastructure designed to return probability distributions across all 7 disease classes (`nv`, `mel`, `bcc`, `bkl`, `akiec`, `vasc`, `df`) and calculate risk velocity.

## 🛠 Tech Stack

- **Framework:** Django 5.x, Django REST Framework (DRF)
- **Machine Learning:** TensorFlow, Keras, NumPy
- **Database:** SQLite3 (Configured for standard relational modeling)
- **Image Processing:** OpenCV, Pillow

## 📂 Architecture overview
- `APIs/`: Contains all business logic (`views.py`), data models (`models.py`), and REST endpoints.
- `ml_models/`: The core AI engine. Contains `predictor.py` (model loading and logic), `skin_disease_pipeline.py` (training pipeline), and the `.h5` custom weights.
- `media/`: Persistent storage for uploaded high-resolution or dermoscope scans.

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TTF-ai/AI-STHETICA_BACKEND.git
   cd AI-STHETICA_BACKEND
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv1
   # Windows
   .\venv1\Scripts\activate
   # MacOS/Linux
   source venv1/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Migrations & Start Server:**
   ```bash
   python manage.py makemigrations APIs
   python manage.py migrate
   python manage.py runserver
   ```
   *The server runs locally on `http://127.0.0.1:8000/`*

## 🧑‍⚕️ API Design
All critical AI metrics are natively attached to the `ScanLog` resources:
- `predicted_disease`: Primary AI diagnosis.
- `risk_score`: Aggregated algorithmic risk out of 100%.
- `risk_category`: Categorical tag (`LOW`, `MEDIUM`, `HIGH`).
- `all_probs`: Full softmax probability array.
