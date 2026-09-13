# Setup Guide — GridSentinel AI

> **This file is read by the automated evaluation pipeline and human judges. Follow the steps below to run both the FastAPI backend and React frontend.**

---

## Prerequisites

Ensure you have the following installed on your workstation:

- **Python:** 3.10 or higher
- **Node.js:** 18.x or higher (with `npm` 9+)
- **Git**
- *(Optional)* An **IBM Cloud** account with access to **watsonx.ai** and the `ibm/granite-3-8b-instruct` model (not required for offline demo mode).

---

## Environment Variables

Copy `.env.example` in `src/` to `.env` if you have IBM watsonx.ai credentials:

```bash
# Windows
copy src\.env.example src\.env

# Linux / macOS
cp src/.env.example src/.env
```

| Variable | Description | Required |
|---|---|---|
| `WATSONX_API_KEY` | Your IBM Cloud / watsonx.ai API key | No *(Built-in offline fallback provided)* |
| `WATSONX_PROJECT_ID` | Your watsonx.ai Project ID | No *(Built-in offline fallback provided)* |
| `WATSONX_URL` | Watsonx service URL (default: `https://us-south.ml.cloud.ibm.com`) | No |

> 💡 **Offline Mode:** If `WATSONX_API_KEY` is omitted or invalid, GridSentinel AI automatically generates high-fidelity deterministic work orders so judges can test every feature without creating an IBM Cloud account.

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/mahek1907/bob-ai-hackathon-Team-Mantra.git
cd bob-ai-hackathon-Team-Mantra
```

### 2. Backend Installation (FastAPI)

```bash
# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
.\venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r src/requirements.txt
```

### 3. Frontend Installation (React + Vite)

In a second terminal window:

```bash
cd frontend
npm install
```

---

## Running the Application

### Step 1: Start the FastAPI Backend

In your backend terminal (with virtual environment activated):

```bash
uvicorn src.server:app --reload --port 8000
```

- **Backend API URL:** `http://localhost:8000`
- **Interactive OpenAPI/Swagger Docs:** `http://localhost:8000/docs`

### Step 2: Start the React Frontend

In your frontend terminal (`cd frontend`):

```bash
npm run dev
```

- **Frontend Application URL:** `http://localhost:5173`

---

## Running Tests

Verify that all deterministic diagnostic and risk prioritization engines pass IEEE standards:

```bash
pytest tests/ -v
```

Expected output:
```text
tests/test_dga_engine.py ...... PASSED
tests/test_risk_engine.py ...... PASSED
tests/test_weather_engine.py ... PASSED
==================== 100% passed in X.XXs ====================
```

---

## Quick Demo Walkthrough

1. Open `http://localhost:5173` in your browser.
2. Observe the **Fleet Health KPI Cards** showing total active transformers and weather alert status.
3. Review the **Weather Stress Multiplier** panel showing temperature, wind gust speeds, and compounding factor.
4. Filter or click on high-risk transformer **`TX-401`** (Metro Central Transit Substation).
5. Expand the telemetry accordion to inspect the **IEEE C57.104 DGA gas ppm** levels (Acetylene, Hydrogen, Ethylene).
6. Click **"Generate Dispatch Directive"** to trigger **IBM Granite 3.0**.
7. Review the AI-synthesized staging depot, required diagnostic equipment, and sign-off checklist.
8. Click **"Operator Countersign"** and export the dispatch report.

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `ModuleNotFoundError` | Virtual environment not activated or missing packages | Run `pip install -r src/requirements.txt` inside active venv. |
| Port `8000` already in use | Another application is bound to 8000 | Run `uvicorn src.server:app --port 8080` and adjust the API proxy URL in frontend. |
| CORS error in browser console | Backend not running or origin mismatch | Ensure FastAPI server is running on `http://localhost:8000`. |
| `npm: command not found` | Node.js is not installed | Install Node.js LTS from [nodejs.org](https://nodejs.org). |
| Watsonx 401 Unauthorized | Incorrect API key in `.env` | Remove or fix `WATSONX_API_KEY`; system will safely use the offline fallback. |
