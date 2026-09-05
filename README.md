# ⚡ Multi-Source Financial Reconciliation Engine
### *High-Throughput 3-Way Tri-Party Reconciliation Engine + Google Gemini AI Forensic Copilot*

[![Netlify Status](https://img.shields.io/badge/Live_Demo-reconcile--ai--razorpay.netlify.app-00C7B7.svg?logo=netlify&logoColor=white)](https://reconcile-ai-razorpay.netlify.app/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org)
[![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-8E75B2.svg?logo=google-gemini&logoColor=white)](https://ai.google.dev)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance, enterprise-ready **3-Way Financial Reconciliation Platform** engineered to ingest, normalize, and reconcile high-volume transaction feeds across three distinct financial streams: **Internal Invoices**, **Payment Gateway Transactions**, and **Bank Settlements**.

The platform combines a high-speed **4-Signal deterministic scoring engine** with an interactive **Google Gemini AI Forensic Copilot**. High-confidence transactions are automatically reconciled, while ambiguous cases are surfaced for human review. The AI Investigator assists reviewers by investigating discrepancies, explaining possible causes, and providing evidence-based recommendations.

---

> 🌐 **Try It Live**: Test the platform with custom CSV datasets or generate synthetic benchmark data directly from the interface:  
> **👉 [https://reconcile-ai-razorpay.netlify.app/](https://reconcile-ai-razorpay.netlify.app/)**

---

## 📑 Table of Contents
- [🎯 Architecture Overview](#-architecture-overview)
- [🌐 Live Deployment](#-live-deployment)
- [📈 Verified Benchmark](#-verified-benchmark)
- [📸 Platform Glimpses](#-platform-glimpses)
- [🌟 Key Platform Capabilities](#-key-platform-capabilities)
- [🧠 Design Philosophy](#-design-philosophy)
- [🛠 Tech Stack & Dependencies](#-tech-stack--dependencies)
- [📁 Project Directory Structure](#-project-directory-structure)
- [🚀 Quick Start Guide](#-quick-start-guide)
  - [1. Backend Setup (FastAPI)](#1-backend-setup-fastapi)
  - [2. Frontend Setup (React + Vite)](#2-frontend-setup-react--vite)
- [🔐 Environment Configuration](#-environment-configuration)
- [📡 Core API Endpoints](#-core-api-endpoints)
- [⚙️ 4-Signal Scoring & Decision Rules](#️-4-signal-scoring--decision-rules)
- [🚦 Reconciliation Status Taxonomy](#-reconciliation-status-taxonomy)
- [💡 Demonstration & Testing Tips](#-demonstration--testing-tips)

---

## 🎯 Architecture Overview

The reconciliation pipeline is designed for high throughput while maintaining deterministic and explainable matching across all three financial data streams.

![Architecture Overview](images/architecture%20overview.png)

### The 6-Phase Pipeline Lifecycle:
1. **Ingestion & Validation**: Schema integrity checks, encoding validation, and quarantine of invalid records.
2. **Normalization Engine**: Standardizes customer names, alphanumeric references, amounts, and dates across heterogeneous source formats.
3. **Data Quality & Quarantine**: Detects duplicate references, missing fields, invalid records, and data collisions.
4. **Candidate Space Indexing**: Uses hash lookups, amount tolerance bands ($\pm5\%$), and entity name indexing to eliminate unnecessary $O(N^2)$ comparisons.
5. **Deterministic 4-Signal Scoring**: Evaluates candidate matches across Reference, Amount, Customer Name, and Date Proximity signals using a transparent 0 to 100 score.
6. **3-Way Consistency Classification**: Assigns definitive reconciliation statuses and surfaces discrepancies for auditor review.

---

## 🌐 Live Deployment

> 🚀 **Live Demo**: **[https://reconcile-ai-razorpay.netlify.app/](https://reconcile-ai-razorpay.netlify.app/)**  
> The deployed platform supports custom CSV uploads, interactive schema remapping, synthetic benchmark generation, reconciliation telemetry, detailed audit views, and AI-assisted investigation.

---

## 📈 Verified Benchmark

The reconciliation engine was evaluated against a reproducible synthetic dataset with known ground truth labels.

| Metric | Result |
| :--- | :---: |
| **Verified Test Cases** | **715** |
| **Accuracy** | **99.9%** |
| **Precision** | **100.0%** |
| **Recall** | **99.8%** |
| **F1 Score** | **99.91%** |
| **False Positive Matches** | **0** |
| **Processing Time** | **3.89 sec** |
| **Throughput** | **~184 records/sec** |

* The benchmark uses a fixed random seed and controlled anomalies to make results reproducible and objectively measurable.
* The synthetic generator introduces realistic reconciliation scenarios such as amount mismatches, MDR fee deductions, missing payments, missing bank transactions, and duplicate records.

---

## 📸 Platform Glimpses

### 1. Unified Dashboard, Real-Time Telemetry & Financial KPIs
*Real-time pipeline telemetry, financial summary cards, reconciliation statistics, and one-click benchmark execution.*
![Unified Dashboard](images/1.png)

---

### 2. Tri-Party Discrepancy Matrix & Filterable Reconciliation Table
*Filterable transaction matrix with search, status indicators, confidence scores, and multi-stream transaction IDs.*
![Reconciliation Results Table](images/2.png)

---

### 3. Detailed Tri-Party Record Audit & 4-Signal Score Breakdown
*Side-by-side comparison across Invoice, Payment, and Bank streams with transparent signal-level scoring.*
![Tri-Party Record Audit](images/3.png)

---

### 4. Gemini AI Forensic Copilot & Interactive Auditor Chat
*AI-assisted investigation of discrepancies with interactive follow-up questions and evidence-based reasoning.*
![Gemini AI Forensic Copilot](images/4.png)

---

## 🌟 Key Platform Capabilities

### ⚡ 1. 3-Way Tri-Party Consistency Engine
Cross-references **Invoices**, **Payment Gateway Records**, and **Bank Settlement Feeds** simultaneously to establish end-to-end financial consistency.

### 🎯 2. Deterministic 4-Signal Scoring Engine
Evaluates candidate matches using a transparent, weighted 100-point scoring algorithm:

| Signal | Weight | Evaluation Logic |
| :--- | :---: | :--- |
| **Reference Match** | **40 pts** | Exact normalized alphanumeric reference match |
| **Amount Match** | **30 pts** | Exact match ($\pm₹0.01$), small variance ($\le 1\%$), or tolerance band ($\le 5\%$) |
| **Customer Entity Name** | **20 pts** | Fuzzy entity similarity after legal suffix normalization |
| **Date Proximity** | **10 pts** | Proximity based on transaction timestamp and settlement float lag |

### 🛡️ 3. Ambiguity Margin Guardrail
Protects against false positive matches:
- If the top candidate has a sufficiently high score ($\ge 70$) but the difference between the top candidate and the second best candidate is below the safety margin ($< 10$ points), the system flags the transaction as **`AMBIGUOUS_MATCH`** instead of forcing an automatic reconciliation.
- **High-confidence transactions are automatically reconciled. Ambiguous cases are routed for human review.**

### 🤖 4. Google Gemini AI Forensic Copilot
The AI layer follows an **"AI only where needed"** approach:
- Investigates ambiguous or unresolved financial cases.
- Compares relevant financial records across all 3 streams.
- Explains possible causes of discrepancies (e.g., standard 2.0% MDR + 18% GST fee deductions).
- Helps reviewers understand settlement differences and bank float delays.
- Supports interactive multi-turn auditor Q&A.
- Provides recommended evidence-based next actions.
- **Keeps the final financial decision with the human reviewer.**

> *The AI acts as an investigation and decision support layer, not the source of truth for financial reconciliation.*

### 📊 5. Built-In Synthetic Benchmark Generator
Generate realistic multi-stream financial records with known ground truth and controlled anomalies to measure:
- Accuracy, Precision, Recall, F1 Score
- False Positive Rate ($0\%$)
- Throughput and Processing Latency

### 🔄 6. Client-Side Schema Validator & Column Mapping Wizard
Supports custom CSV datasets with arbitrary, non-standard column names:
- `Bill No` / `Doc_Number` → `invoice_id`
- `Client` / `Billing_Party` → `customer`
- `Gross_Amount` / `Total` → `amount`
- `UTR` / `Bank_Ref` → `transaction_id`

The interface automatically detects aliases, validates required fields, provides an interactive 2-tab mapping wizard with a live 5-row data preview, and transforms files in-memory before backend ingestion.

---

## 🧠 Design Philosophy

The system follows a simple principle:
> **"Automate what can be proven. Investigate what cannot. Keep humans in control."**

1. **Deterministic Speed**: The reconciliation engine establishes high-confidence matches using transparent, mathematically sound financial signals.
2. **AI Where It Matters**: AI is introduced only when it provides additional value—particularly for ambiguous or complex exceptions that require forensic explanation.
3. **Explainability & Trust**: Reduces unnecessary LLM overhead, eliminates hallucination risks in matching, and keeps financial decisions firmly under human auditor control.

---

## 🛠 Tech Stack & Dependencies

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Data Ingestion & Processing**: [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/)
- **Data Validation & Schemas**: [Pydantic v2](https://docs.pydantic.dev/)
- **Fuzzy String Matching**: [RapidFuzz](https://github.com/maxbachmann/RapidFuzz) (with pure-Python fallback)
- **AI / LLM Engine**: [Google GenAI SDK](https://github.com/google/generative-ai-python) (`gemini-2.5-flash` / `gemini-1.5-flash`)
- **Server**: [Uvicorn](https://www.uvicorn.org/)

### Frontend
- **Framework**: [React 18](https://react.dev/)
- **Build Tooling**: [Vite](https://vitejs.dev/)
- **Iconography**: [Lucide React](https://lucide.dev/)
- **Styling Architecture**: Custom CSS Design System (Glassmorphism, telemetry indicators, responsive cards)

---

## 📁 Project Directory Structure

```
multi-source-reconsilation-razorpay-hack/
├── backend/                    # FastAPI Backend Application
│   ├── api/                    # API Route Controllers
│   │   ├── ai.py               # /ai/analyze-record, /ai/chat, /ai/status
│   │   └── reconciliation.py   # /reconcile & /evaluate-benchmark endpoints
│   ├── data/                   # Data Generators & Sample Datasets
│   │   ├── sample/             # Sample CSVs (invoices, payments, bank_transactions)
│   │   └── synthetic_generator.py # Synthetic dataset benchmark generator
│   ├── models/                 # Pydantic Schemas & Enums
│   │   ├── enums.py            # Status enums (RECONCILED, AMOUNT_MISMATCH, etc.)
│   │   └── schemas.py          # Request & Response schemas
│   ├── services/               # Reconciliation & AI Algorithms
│   │   ├── candidate_generator.py # Candidate space indexing & filtering
│   │   ├── duplicate_detector.py  # Reference & amount collision detection
│   │   ├── file_parser.py      # Resilient CSV parser & validator
│   │   ├── gemini_service.py   # Google Gemini AI Copilot & forensic reasoning
│   │   ├── matcher.py          # 4-signal candidate scoring engine
│   │   ├── metrics.py          # Precision, recall, F1 benchmark metrics
│   │   ├── normalizer.py       # Name, reference, date & amount normalizers
│   │   ├── reconciler.py       # 3-way reconciliation pipeline
│   │   ├── scorer.py           # Scoring heuristics and weightings
│   │   └── validator.py        # Data quality checks & quarantine
│   ├── utils/                  # Helper Utilities
│   │   ├── amounts.py          # Currency parsing & tolerances
│   │   ├── dates.py            # Multi-format date parsing & float calculations
│   │   └── text.py             # String sanitization & fuzzy ratio matching
│   ├── .env                    # Environment variables (GEMINI_API_KEY)
│   ├── .gitignore              # Backend gitignore rules
│   ├── main.py                 # FastAPI Application entry point & CORS
│   └── requirements.txt        # Python Dependencies
├── frontend/                   # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ColumnMappingModal.jsx # 2-tab interactive column mapping wizard
│   │   │   ├── HeroSection.jsx     # Header & summary metrics
│   │   │   ├── MetricsGrid.jsx     # Financial KPIs & benchmark metrics
│   │   │   ├── Navbar.jsx          # Top navigation bar
│   │   │   ├── ProcessingLive.jsx  # 6-phase live telemetry visualization
│   │   │   ├── RecordModal.jsx     # Tri-party audit & Gemini AI Copilot modal
│   │   │   ├── ResultsTable.jsx    # Filterable reconciliation results table
│   │   │   ├── UnderTheHood.jsx    # System architecture & scoring explainer
│   │   │   └── UploadReconcile.jsx  # 3-file drag-and-drop CSV uploader
│   │   ├── utils/
│   │   │   ├── api.js              # Fetch API client wrapper
│   │   │   └── csvMapper.js        # Client-side schema validator & transformer
│   │   ├── App.jsx                 # Root application component
│   │   ├── index.css               # Design system, CSS variables & animations
│   │   └── main.jsx                # DOM entry point
│   ├── .gitignore              # Frontend gitignore rules
│   ├── index.html              # HTML template
│   ├── package.json            # Node.js dependencies & scripts
│   ├── package-lock.json       # Lockfile
│   └── vite.config.js          # Vite configuration
├── custom_test_datasets/       # Enterprise test datasets with custom headers
│   ├── corporate_bank_statement.csv
│   ├── erp_invoices_sap_export.csv
│   └── gateway_payments_export.csv
├── images/                     # Platform screenshots & architecture diagrams
│   ├── 1.png
│   ├── 2.png
│   ├── 3.png
│   ├── 4.png
│   └── architecture overview.png
├── .gitignore                  # Workspace root gitignore
└── README.md                   # System Documentation
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup (FastAPI)

```bash
cd multi-source-reconsilation-razorpay-hack/backend
```

**Create and activate a Python virtual environment:**
- **Windows (PowerShell / CMD)**:
  ```powershell
  python -m venv .venv
  .venv\Scripts\activate
  ```
- **macOS / Linux**:
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Start FastAPI server:**
```bash
uvicorn main:app --reload --port 8000
```
- **API Server**: `http://localhost:8000`
- **Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`
- **AI Status Check**: `http://localhost:8000/ai/status`

---

### 2. Frontend Setup (React + Vite)

Open a second terminal:
```bash
cd multi-source-reconsilation-razorpay-hack/frontend
npm install
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

---

## 🔐 Environment Configuration

Create a `.env` file inside the `backend/` directory:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=8000
```

| Variable | Required | Description | Default |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key for AI Forensic Copilot | `""` |
| `PORT` | Optional | FastAPI server port | `8000` |

*(Note: If `GEMINI_API_KEY` is not provided, the backend returns clear setup guidance in the UI without breaking reconciliation).*

---

## 📡 Core API Endpoints

### 1. `POST /reconcile`
Uploads and reconciles `invoices.csv`, `payments.csv`, and `bank_transactions.csv`.
```bash
curl -X POST "http://localhost:8000/reconcile" \
  -F "invoices=@invoices.csv" \
  -F "payments=@payments.csv" \
  -F "bank_transactions=@bank_transactions.csv"
```

### 2. `POST /evaluate-benchmark?count=500&seed=42`
Generates synthetic financial data with ground-truth labels and returns benchmark metrics including Accuracy, Precision, Recall, F1 Score, and Throughput.

### 3. `POST /ai/analyze-record`
Runs a forensic investigation on a specific reconciliation case using Gemini AI:
```json
{
  "invoice_id": "INV-1029",
  "invoice_amount": 50000.0,
  "payment_amount": 50000.0,
  "bank_amount": 48820.0,
  "customer_name": "Acme Corp Pvt Ltd",
  "reference": "REF-99201",
  "status": "AMOUNT_MISMATCH",
  "reasons": ["Bank amount differs from invoice amount"]
}
```

### 4. `POST /ai/chat`
Enables continuous multi-turn investigation with Gemini using the specific record context:
```json
{
  "record": { "invoice_id": "INV-1029" },
  "messages": [
    { "role": "user", "content": "Why is the bank amount lower?" }
  ],
  "user_query": "What could explain this difference?"
}
```

### 5. `GET /ai/status`
Checks whether the Gemini API key configuration is active.

### 6. `GET /health`
Returns system health and operational status.

---

## ⚙️ 4-Signal Scoring & Decision Rules

The deterministic matching engine computes a composite score from 0 to 100 using four independent signals:

| Signal | Max Weight | Evaluation Logic |
| :--- | :---: | :--- |
| **Reference Match** | **40 pts** | Exact normalized alphanumeric reference match |
| **Amount Match** | **30 pts** | Exact match ($\pm₹0.01$), small variance ($\le 1\%$), or tolerance band ($\le 5\%$) |
| **Customer Name** | **20 pts** | Fuzzy entity similarity after legal suffix normalization |
| **Date Proximity** | **10 pts** | Based on transaction and settlement date proximity |

### Ambiguity Margin Rule:
If the top candidate has a sufficiently high score ($\ge 70$) but the difference between the top candidate and the second candidate is below the safety margin ($< 10$ points), the engine flags the record as:
**`AMBIGUOUS_MATCH`**

This prevents the system from forcing uncertain matches and minimizes false positives.

---

## 🚦 Reconciliation Status Taxonomy

| Status | Meaning |
| :--- | :--- |
| **`RECONCILED`** | High-confidence match across all three streams |
| **`AMOUNT_MISMATCH`** | Records are linked, but amounts differ (e.g., MDR fees, tax withholding) |
| **`MISSING_PAYMENT`** | Invoice linked to Bank record, but Gateway payment record is missing |
| **`MISSING_BANK_TRANSACTION`** | Invoice linked to Gateway payment, but Bank settlement is pending/missing |
| **`DUPLICATE`** | Conflicting duplicate records detected |
| **`AMBIGUOUS_MATCH`** | Multiple competing candidate matches within the safety threshold |
| **`REVIEW_REQUIRED`** | Medium-confidence case requiring human auditor verification |
| **`UNMATCHED`** | No suitable candidate found across external streams |

---

## 💡 Demonstration & Testing Tips

1. **Run the Synthetic Benchmark**: Click **"Run 500+ Synthetic Benchmark"** in the UI to generate reproducible synthetic data and evaluate the engine using known ground truth.
2. **Inspect Reconciliation Results**: Click any transaction in the results table to open the detailed tri-party audit view.
3. **Investigate Exceptions With AI**: For ambiguous or unresolved cases, open the **"Investigate with AI"** tab to run root-cause diagnosis and ask interactive follow-up questions.
4. **Test Custom CSV Datasets**: Use the **"Custom CSV Reconcile"** tab with files in `custom_test_datasets/` to test client-side column remapping.
