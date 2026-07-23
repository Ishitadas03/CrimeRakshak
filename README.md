# 🔍 CrimeRakshak

<img width="1774" height="887" alt="file_00000000f88882068813e530c9b46344" src="https://github.com/user-attachments/assets/55dc0184-89e7-44d7-a12b-0b833cb31f64" />

> **Intelligent Conversational AI & Graph Analytics Platform for Karnataka State Police (KSP)**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-000000.svg?style=flat&logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB.svg?style=flat&logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Neo4j](https://img.shields.io/badge/Neo4j-5.x-008CC1.svg?style=flat&logo=neo4j)](https://neo4j.com)
[![DuckDB](https://img.shields.io/badge/DuckDB-1.0+-FFF000.svg?style=flat&logo=duckdb)](https://duckdb.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1.svg?style=flat&logo=postgresql)](https://postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)

---

CrimeRakshak is an enterprise-grade crime intelligence and investigation platform designed for police departments and law enforcement agencies. It fuses **Conversational AI (LLM)**, **Neo4j Graph Database analytics**, **DuckDB in-memory OLAP analytics**, and **Machine Learning forecasting (XGBoost / ARIMA)** to empower investigators to query crime records in natural language (English & Kannada), map complex criminal networks, trace illicit financial flows, and predict crime hotspots.

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture & Pipeline](#️-architecture--pipeline)
  - [System Architecture](#system-architecture)
  - [Data Processing Pipeline](#data-processing-pipeline)
  - [Conversational AI Data Flow](#conversational-ai-data-flow)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🔌 API Reference](#-api-reference)
- [🤖 AI Tool-Calling System](#-ai-tool-calling-system)
- [🔑 Environment Variables](#-environment-variables)
- [💻 Local Development Setup](#-local-development-setup)
- [🗄️ Database Setup & Ingestion](#️-database-setup--ingestion)
- [🚀 Deployment](#-deployment)
- [🔐 Security Design & Compliance](#-security-design--compliance)
- [📝 License](#-license)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🤖 **Bilingual Conversational AI** | Natural language Q&A over KSP crime database in **English & Kannada** powered by tool-calling LLMs (OpenRouter / Gemini) with grounded answers and source citations. |
| 🕸️ **Interactive Criminal Networks** | Dynamic 2D/3D force-directed graph visualization of offenders, victims, witnesses, FIRs, phone numbers, and bank accounts using Neo4j. |
| 💰 **Financial Crime & Money Trail** | Multi-hop fund flow tracing, circular transaction loop detection, shell account pass-through detection, and suspicious activity flagging. |
| 📊 **High-Performance Analytics** | Instant aggregation over millions of crime records, district reviews, disposal stats, and crime trends using embedded DuckDB OLAP. |
| 🔮 **Predictive Crime Intelligence** | ML forecasting engine using **XGBoost + ARIMA** to predict regional crime trends, seasonal spikes, and hotspot vulnerabilities. |
| 🔐 **Enterprise Auth & RBAC** | Fine-grained Role-Based Access Control (RBAC), JWT authentication with single-use refresh token rotation, account lockout, and full audit logging. |
| 🌐 **Kannada Translation Engine** | Real-time Kannada ⇄ English neural translation for chat queries and investigative responses. |
| 📄 **Investigative PDF Reports** | Generate exportable, audit-ready PDF conversation transcripts formatted with Unicode font rendering for Kannada script. |

---

## 🏗️ Architecture & Pipeline

### System Architecture

```mermaid
flowchart TB
    %% Styling Definitions
    classDef clientStyle fill:#4F46E5,stroke:#3730A3,stroke-width:2px,color:#FFFFFF,font-weight:bold
    classDef apiStyle fill:#0EA5E9,stroke:#0284C7,stroke-width:2px,color:#FFFFFF,font-weight:bold
    classDef authStyle fill:#D97706,stroke:#B45309,stroke-width:2px,color:#FFFFFF
    classDef aiStyle fill:#8B5CF6,stroke:#6D28D9,stroke-width:2px,color:#FFFFFF
    classDef graphStyle fill:#06B6D4,stroke:#0891B2,stroke-width:2px,color:#FFFFFF
    classDef finStyle fill:#10B981,stroke:#059669,stroke-width:2px,color:#FFFFFF
    classDef analyticsStyle fill:#EC4899,stroke:#DB2777,stroke-width:2px,color:#FFFFFF
    classDef mlStyle fill:#6366F1,stroke:#4338CA,stroke-width:2px,color:#FFFFFF
    classDef dbPgStyle fill:#1E40AF,stroke:#1D4ED8,stroke-width:2px,color:#FFFFFF
    classDef dbDuckStyle fill:#CA8A04,stroke:#A16207,stroke-width:2px,color:#FFFFFF
    classDef dbNeoStyle fill:#047857,stroke:#065F46,stroke-width:2px,color:#FFFFFF
    classDef llmStyle fill:#E11D48,stroke:#BE123C,stroke-width:2px,color:#FFFFFF

    subgraph ClientLayer["🖥️ CLIENT PRESENTATION LAYER"]
        UI["Next.js 16 (App Router) + React 19<br/><i>(Dashboards · Chat AI · Force Graph · Heatmaps)</i>"]:::clientStyle
    end

    UI -->|HTTPS / REST API + JWT Bearer| FastAPI

    subgraph BackendLayer["⚡ FASTAPI BACKEND SERVICE LAYER (Python 3.9+)"]
        FastAPI["FastAPI App Gateway & CORS Middleware"]:::apiStyle

        subgraph CoreModules["Service Modules"]
            Auth["🔒 Auth & RBAC<br/><i>JWT · Sessions · Audit</i>"]:::authStyle
            ChatAI["🤖 Conversational AI<br/><i>Tool Loop & Agent</i>"]:::aiStyle
            GraphIntel["🕸️ Graph Intelligence<br/><i>Cypher & Union-Find</i>"]:::graphStyle
            Financial["💰 Financial Crime<br/><i>Money Trail Tracing</i>"]:::finStyle
            Analytics["📊 Analytics Engine<br/><i>DuckDB Execution</i>"]:::analyticsStyle
            Predictor["🔮 ML Predictor<br/><i>XGBoost & ARIMA</i>"]:::mlStyle
        end

        FastAPI --> Auth & ChatAI & GraphIntel & Financial & Analytics & Predictor
    end

    subgraph StorageLayer["🗄️ PERSISTENCE & ANALYTICS DATABASES"]
        PG[("🐘 PostgreSQL (Neon)<br/><i>Users · RBAC · Audit Logs</i>")]:::dbPgStyle
        DuckDB[("🦆 DuckDB (Embedded OLAP)<br/><i>Crime Statistics CSVs</i>")]:::dbDuckStyle
        Neo4j[("🕸️ Neo4j Graph (AuraDB)<br/><i>Entities · FIRs · Accounts</i>")]:::dbNeoStyle
    end

    subgraph AICloud["☁️ EXTERNAL AI LLM PROVIDERS"]
        LLM["🤖 OpenRouter API / Google Gemini API<br/><i>(Tool Calling & Natural Language Response)</i>"]:::llmStyle
    end

    Auth --> PG
    Predictor --> DuckDB
    Analytics --> DuckDB
    ChatAI <-->|Function Calls| LLM
    ChatAI --> DuckDB & Neo4j
    GraphIntel --> Neo4j
    Financial --> Neo4j
```

### Data Processing Pipeline

The CrimeRakshak platform functions across 5 integrated operational stages:

```mermaid
flowchart TD
    %% Custom Stage Color Themes
    classDef stage1 fill:#0F766E,stroke:#0D9488,stroke-width:2px,color:#FFFFFF
    classDef stage2 fill:#1D4ED8,stroke:#2563EB,stroke-width:2px,color:#FFFFFF
    classDef stage3 fill:#6D28D9,stroke:#7C3AED,stroke-width:2px,color:#FFFFFF
    classDef stage4 fill:#C2410C,stroke:#EA580C,stroke-width:2px,color:#FFFFFF
    classDef stage5 fill:#15803D,stroke:#16A34A,stroke-width:2px,color:#FFFFFF

    subgraph Stage1["📥 STAGE 1: Data Ingestion & Storage"]
        RawCSV[KSP Crime CSV Datasets] --> Loader[Ingestion Pipeline]
        Loader -->|Structured Records| PG[(🐘 PostgreSQL - Neon)]:::stage1
        Loader -->|Pre-aggregated Stats| DDB[(🦆 DuckDB OLAP)]:::stage1
        Loader -->|Entities & Relations| N4J[(🕸️ Neo4j Graph DB)]:::stage1
    end

    subgraph Stage2["⚡ STAGE 2: Graph & Analytics Processing"]
        N4J -->|Cypher Queries| GraphEngine[Graph Service]:::stage2
        DDB -->|Vectorized SQL| AnalyticsEngine[Analytics Service]:::stage2
        GraphEngine -->|Community Detection| UF[Union-Find Co-offenders]:::stage2
        AnalyticsEngine -->|Feature Extraction| ML[XGBoost / ARIMA Engine]:::stage2
    end

    subgraph Stage3["🧠 STAGE 3: AI Reasoning & Tool Calling"]
        UserQuery[User Query EN / KN] --> Translator{Language Check}:::stage3
        Translator -->|Kannada| ENTrans[KN → EN Translation]:::stage3
        Translator -->|English| Agent[Tool-Calling LLM Agent]:::stage3
        ENTrans --> Agent
        Agent <-->|Execute Tools| Tools[9 System Tools]:::stage3
        Tools <--> GraphEngine
        Tools <--> AnalyticsEngine
    end

    subgraph Stage4["🛡️ STAGE 4: Synthesis & Security Controls"]
        Agent -->|Synthesized Result| Guard[SELECT-only & Audit Guardrail]:::stage4
        Guard --> Audit[(PostgreSQL Audit Log)]:::stage4
        Guard --> ResTrans{Target Language}:::stage4
        ResTrans -->|Kannada| KNTrans[EN → KN Translation]:::stage4
        ResTrans -->|English| FinalAns[Final Grounded Response]:::stage4
        KNTrans --> FinalAns
    end

    subgraph Stage5["🖥️ STAGE 5: UI Presentation & Export"]
        FinalAns --> WebApp[Next.js Dashboard & Chat UI]:::stage5
        FinalAns --> PDFGen[ReportLab PDF Engine]:::stage5
    end
```

### Conversational AI Data Flow

```mermaid
flowchart LR
    classDef inputStyle fill:#3B82F6,stroke:#1D4ED8,color:#FFF,font-weight:bold
    classDef agentStyle fill:#8B5CF6,stroke:#6D28D9,color:#FFF,font-weight:bold
    classDef duckStyle fill:#CA8A04,stroke:#A16207,color:#FFF
    classDef neoStyle fill:#047857,stroke:#065F46,color:#FFF
    classDef outStyle fill:#10B981,stroke:#059669,color:#FFF,font-weight:bold

    Query["User Query<br/>(English / Kannada)"]:::inputStyle --> Trans["Translator Module<br/>(deep-translator)"]:::inputStyle
    Trans --> Agent["LLM Agent Loop<br/>(Gemini / OpenRouter)"]:::agentStyle

    Agent -->|Analytics Tool| T1["query_crime_stats()"]:::duckStyle
    Agent -->|Summary Tool| T2["district_review_summary()"]:::duckStyle
    Agent -->|Trend Tool| T3["rising_crimes() / crime_trend()"]:::duckStyle
    Agent -->|Case Tool| T4["case_summary() / timeline()"]:::neoStyle
    Agent -->|Lead Tool| T5["suggest_leads() / similar_cases()"]:::neoStyle

    T1 & T2 & T3 --> DuckDB[("🦆 DuckDB")]:::duckStyle
    T4 & T5 --> Neo4j[("🕸️ Neo4j Graph")]:::neoStyle

    DuckDB & Neo4j --> Grounded["Grounded Answer + Citations"]:::outStyle
    Grounded --> Render["Next.js UI & PDF Export"]:::outStyle
```

---

## 🛠️ Tech Stack

### Backend Technologies

| Component | Stack | Purpose |
|---|---|---|
| **Runtime** | Python 3.9+ | Main application execution environment |
| **Framework** | FastAPI 0.110+ | High-performance asynchronous REST API framework |
| **Server** | Uvicorn / Gunicorn | ASGI web server for production deployment |
| **Relational Database** | PostgreSQL (Neon Cloud) | Manages authentication, RBAC, user profiles, and security audit logs |
| **Graph Database** | Neo4j 5.x (AuraDB) | Stores criminal network graphs, FIR linkages, entity relationships, and fund flows |
| **Analytical Engine** | DuckDB 1.0+ | Fast in-memory OLAP SQL engine over large crime CSV datasets |
| **AI & LLM Services** | OpenRouter / Google Gemini | Powering tool-calling conversational agent & text summarization |
| **Machine Learning** | Scikit-learn, XGBoost, Statsmodels | Time-series forecasting, trend projections, and crime hotspot detection |
| **ORM & Migrations** | SQLAlchemy 2.0 & Alembic | Schema definition and database migration versioning |
| **Security & Auth** | JWT (`python-jose`), `bcrypt`, `passlib` | Secure password hashing, token generation, and RBAC middleware |
| **PDF Generation** | ReportLab | Generates PDF transcripts supporting Unicode and Noto Sans Kannada fonts |

### Frontend Technologies

| Component | Stack | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | React framework providing SSR, API routing, and optimized builds |
| **UI Library** | React 19 + TypeScript 5 | Component-driven frontend architecture with static typing |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Modern utility-first styling system and polished UI primitives |
| **Network Visualization** | `react-force-graph-2d` / `d3-force-3d` | Interactive 2D/3D physics-based criminal network graph renderer |
| **Data Visualization** | Recharts | Interactive bar, line, pie, and area charts for crime statistics |
| **Authentication** | Clerk (`@clerk/nextjs`) | Authentication provider integration with Next.js middleware |
| **Icons & Animations** | Lucide React & Framer Motion | Dynamic icons and fluid UI layout transitions |

---

## 📁 Project Structure

```
CrimeRakshak/
├── backend/                            # FastAPI Python backend application
│   ├── app/
│   │   ├── main.py                     # FastAPI entrypoint, middleware, and CORS configuration
│   │   ├── seed.py                     # Initial seed for roles, permissions, and superuser
│   │   ├── core/                       # Core system utilities
│   │   │   ├── config.py               # Application settings driven by pydantic-settings
│   │   │   ├── database.py             # PostgreSQL SQLAlchemy engine and session dependency
│   │   │   ├── security.py             # Password hashing (bcrypt) and JWT encoding/decoding
│   │   │   ├── dependencies.py         # Authentication dependencies and RBAC permission guards
│   │   │   ├── exceptions.py           # Custom typed HTTP error handlers
│   │   │   └── logging.py              # Structured application logger
│   │   ├── models/
│   │   │   └── rbac.py                 # SQLAlchemy ORM models (User, Role, Permission, AuditLog)
│   │   ├── schemas/                    # Pydantic validation models for requests/responses
│   │   ├── services/                   # Business logic (auth_service, rbac_service, audit_service)
│   │   ├── routers/                    # REST API endpoint modules
│   │   │   ├── auth.py                 # User authentication (/auth)
│   │   │   ├── admin.py                # System administration and RBAC management (/admin)
│   │   │   ├── analytics.py            # Aggregated analytics endpoints via DuckDB (/analytics)
│   │   │   ├── network.py              # Criminal network endpoints (/network)
│   │   │   ├── predict.py              # ML predictive forecasting (/predict)
│   │   │   └── protected.py            # Access-controlled route examples
│   │   ├── chat/                       # Conversational AI & NLP module
│   │   │   ├── agent.py                # Conversational LLM loop with tool dispatch & memory
│   │   │   ├── tools.py                # Unified tool registry
│   │   │   ├── graph_tools.py          # Neo4j query tools for case investigation
│   │   │   ├── decision_tools.py       # DuckDB analytical tools for aggregate statistics
│   │   │   ├── llm.py                  # OpenRouter & Gemini LLM client abstraction
│   │   │   ├── translate.py            # Deep-Translator integration (Kannada ⇄ English)
│   │   │   ├── pdf.py                  # ReportLab transcript export service
│   │   │   ├── router.py               # Chat REST endpoints (/chat)
│   │   │   └── data/                   # Data loader, schema cards, and query executor
│   │   ├── graph/                      # Neo4j Criminal Network module
│   │   │   ├── connection.py           # Lazy singleton Neo4j driver connection manager
│   │   │   ├── repositories/           # Parameterized Cypher query catalog
│   │   │   ├── services/               # Graph traversal algorithms and community detection
│   │   │   └── routers/                # Graph REST API endpoints (/graph)
│   │   ├── financial/                  # Financial Crime module
│   │   │   ├── repositories/           # Financial Cypher queries (accounts & transactions)
│   │   │   ├── services/               # Fund tracing, circular flow, pass-through algorithms
│   │   │   └── routers/                # Financial crime endpoints (/financial)
│   │   └── ml/                         # Machine Learning forecasting module
│   │       ├── dataset.py              # Feature engineering & dataset preparation
│   │       ├── engines.py              # XGBoost & ARIMA model wrappers
│   │       └── forecast.py             # Forecast execution pipeline
│   ├── alembic/                        # Database migration scripts
│   ├── datasets/                       # Local raw crime dataset CSV storage
│   ├── requirements.txt                # Python backend dependencies
│   └── run.py                          # Application startup script
│
├── frontend/                           # Next.js React frontend web application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/            # Application main layout and routes
│   │   │   │   ├── overview/           # Crime intelligence overview & KPIs
│   │   │   │   ├── ai-assistant/       # Interactive AI chat interface
│   │   │   │   ├── network/            # Interactive criminal network explorer
│   │   │   │   ├── heatmap/            # Spatial hotspot map
│   │   │   │   ├── trends/             # Crime trend analytics dashboard
│   │   │   │   ├── financial/          # Money trail and account graph
│   │   │   │   ├── ai-prediction/      # ML forecasting dashboard
│   │   │   │   ├── case-intel/         # Case intelligence and timeline search
│   │   │   │   ├── profiling/          # Criminal entity profiling
│   │   │   │   ├── district/           # District-wise breakdown
│   │   │   │   └── governance/         # System governance & audit logs
│   │   │   ├── api/                    # Next.js server proxy API routes
│   │   │   ├── sign-in/                # Clerk authentication sign-in
│   │   │   └── sign-up/                # Clerk authentication sign-up
│   │   ├── components/                 # Reusable UI components & shadcn controls
│   │   ├── hooks/                      # React custom hooks
│   │   ├── lib/                        # API client, axios configuration, utilities
│   │   └── types/                      # TypeScript interface definitions
│   ├── public/                         # Static assets and media
│   ├── package.json                    # Node dependencies and scripts
│   └── tailwind.config.ts              # Tailwind CSS styling configuration
│
├── docker/                             # Containerization files
├── docker-compose.yml                  # Multi-service local setup (PostgreSQL, Neo4j, App)
└── db/                                 # Initial database SQL schemas
```

---

## 🔌 API Reference

All backend REST API endpoints are served under `/api/v1`. OpenAPI Interactive documentation is available at `/docs`.

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new user account |
| `POST` | `/auth/login` | Public | Authenticate user and issue Access/Refresh token pair |
| `POST` | `/auth/refresh` | Refresh Token | Rotate refresh token and issue new access token |
| `POST` | `/auth/logout` | Bearer Token | Invalidate current user session |
| `POST` | `/auth/logout-all` | Bearer Token | Revoke all active sessions for the user |
| `GET` | `/auth/me` | Bearer Token | Fetch authenticated user profile and roles |
| `POST` | `/auth/change-password` | Bearer Token | Update authenticated user password |

### Administration (`/api/v1/admin`) — Requires `rbac:manage`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/roles` | List system roles and associated permissions |
| `POST` | `/admin/roles` | Create a new role definition |
| `PATCH` | `/admin/roles/{name}` | Update permissions bound to a specific role |
| `GET` | `/admin/permissions` | List all system permissions |
| `PUT` | `/admin/users/{user_id}/roles` | Assign role definitions to a user |
| `GET` | `/admin/users` | Retrieve full list of platform users |
| `GET` | `/admin/audit-logs` | Query security audit log trail with pagination |

### Conversational AI (`/api/v1/chat`)

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/chat` | Bearer Token | Process query in EN/KN, return AI response with cited sources |
| `GET` | `/chat/{conversation_id}/pdf` | Bearer Token | Export conversation history to formatted PDF report |

### Criminal Network Graph (`/api/v1/graph`) — Requires `graph:read`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/graph/network` | Retrieve multi-hop network nodes around an entity |
| `GET` | `/graph/person/{person_id}` | Detailed profile: linked FIRs, associates, phone numbers |
| `GET` | `/graph/fir/{fir_id}` | FIR breakdown: accused, victims, witnesses, crimes, location |
| `GET` | `/graph/associates/{person_id}` | Direct and 2nd-degree associates |
| `GET` | `/graph/repeat-offenders` | Find offenders associated with $\ge N$ FIRs |
| `GET` | `/graph/organized-groups` | Identify co-offending criminal communities using Union-Find |
| `GET` | `/graph/search` | Search graph nodes by ID, name, or attribute |
| `GET` | `/graph/path` | Calculate shortest relationship path between two entities |

### Financial Crime (`/api/v1/financial`) — Requires `financial:read`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/financial/accounts/{account_no}` | Account profile and linked entity graph |
| `GET` | `/financial/person/{person_id}` | Traverse Person ↔ Bank Account ↔ Transaction chains |
| `GET` | `/financial/transactions` | Search transactions by amount, date, and payment method |
| `GET` | `/financial/money-trail` | Multi-hop downstream fund flow tracing |
| `GET` | `/financial/suspicious` | Detect circular fund transfers, pass-through accounts, and anomalies |
| `GET` | `/financial/path` | Calculate shortest directional transaction path between accounts |

---

## 🤖 AI Tool-Calling System

The AI Assistant utilizes a tool-calling architecture where the LLM does not guess answers; instead, it dynamically selects and invokes appropriate python functions backed by **DuckDB** and **Neo4j**:

```
                              ┌───────────────────────────────────┐
                              │     Conversational AI Agent       │
                              └─────────────────┬─────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                                                             │
                 ▼                                                             ▼
  ┌─────────────────────────────┐                               ┌─────────────────────────────┐
  │   DuckDB Statistical Tools  │                               │    Neo4j Graph Case Tools   │
  ├─────────────────────────────┤                               ├─────────────────────────────┤
  │ 1. query_crime_stats        │                               │ 6. case_summary             │
  │ 2. district_review_summary  │                               │ 7. investigation_timeline   │
  │ 3. rising_crimes            │                               │ 8. similar_cases            │
  │ 4. crime_trend              │                               │ 9. suggest_leads            │
  │ 5. disposal_analysis        │                               │                             │
  └─────────────────────────────┘                               └─────────────────────────────┘
```

1. **`query_crime_stats`**: Runs structured SQL queries on DuckDB for crime rates, case counts, and unit breakdowns.
2. **`district_review_summary`**: Provides executive summaries for crime performance across Karnataka districts.
3. **`rising_crimes`**: Identifies crime categories with statistically significant upward trends over specified periods.
4. **`crime_trend`**: Generates monthly/quarterly time-series stats for trend analysis.
5. **`disposal_analysis`**: Evaluates case disposal ratios, chargesheet rates, and conviction statistics.
6. **`case_summary`**: Retrieves complete case facts, involved suspects, and charges from Neo4j.
7. **`investigation_timeline`**: Builds chronological event sequences for specific FIRs.
8. **`similar_cases`**: Uses graph pattern matching to identify similar modus operandi (M.O.).
9. **`suggest_leads`**: Traverses suspect connections to uncover unlinked co-accused or shared assets.

---

## 🔑 Environment Variables

### Backend Configuration (`backend/.env`)

```env
# ── Database Credentials ──────────────────────────────────────
POSTGRES_URI=postgresql://user:password@ep-sample.neon.tech/crimerakshak?sslmode=require

# ── AI & LLM Engine Settings ──────────────────────────────────
LLM_PROVIDER=openrouter                   # Options: "openrouter" or "gemini"
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
LLM_AGENT_MODEL=google/gemini-2.5-flash
LLM_SUMMARY_MODEL=google/gemini-2.5-flash
LLM_MAX_TOKENS=1024

# ── Neo4j Graph Database ──────────────────────────────────────
USE_NEO4J=True
NEO4J_URI=neo4j+ssc://xxxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password
NEO4J_DATABASE=neo4j

# ── Graph Query Constraints ───────────────────────────────────
GRAPH_MAX_NODES=500
GRAPH_DEFAULT_LIMIT=100
GRAPH_MAX_DEPTH=5

# ── JWT Authentication & Security ─────────────────────────────
SECRET_KEY=e839d0f31c38e92040b2f15a9a834e7f8271038290123
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# ── Security Policies ─────────────────────────────────────────
PASSWORD_MIN_LENGTH=8
MAX_FAILED_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_MINUTES=15

# ── CORS Configuration ────────────────────────────────────────
BACKEND_CORS_ORIGINS=http://localhost:3000,https://crimerakshak.vercel.app

# ── Storage & Analytics ───────────────────────────────────────
DATASETS_DIR=datasets
DUCKDB_PATH=crime_stats.duckdb
```

### Frontend Configuration (`frontend/.env.local`)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_API_URL=http://localhost:9000/api/v1
BACKEND_URL=http://localhost:9000
```

---

## 💻 Local Development Setup

### Prerequisites

- **Python**: 3.9 or higher
- **Node.js**: 18.x or higher with `npm`
- **PostgreSQL**: Local instance or free cloud database on [Neon](https://neon.tech)
- **Neo4j**: 5.x instance or [Neo4j AuraDB Free](https://neo4j.com/cloud/platform/aura-graph-database/)
- **API Key**: [OpenRouter API Key](https://openrouter.ai) or Google Gemini API Key

---

### Step-by-Step Installation

#### 1. Clone Project Repository

```bash
git clone https://github.com/lokojitcoder123/CrimeRakshak-NEW.git
cd CrimeRakshak-NEW
```

#### 2. Setup Backend (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux / macOS:
source venv/bin/activate

# Install required Python dependencies
pip install -r requirements.txt

# Create environment configuration file
cp .env.example .env
# Open .env and add your valid database connection strings and API keys

# Run database schema migrations
alembic upgrade head

# Seed initial roles, permissions, and superuser account
python -m app.seed

# Start backend server
python run.py
```

The API will now be live at: `http://localhost:9000`  
Swagger API Docs accessible at: `http://localhost:9000/docs`

#### 3. Setup Frontend (Next.js)

```bash
cd ../frontend

# Install Node dependencies
npm install

# Create environment configuration file (.env.local)
# Add your NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and NEXT_PUBLIC_API_URL

# Start Next.js development server
npm run dev
```

The web UI will be accessible at: `http://localhost:3000`

---

## 🗄️ Database Setup & Ingestion

### PostgreSQL Database (Neon)
Applies RBAC tables, user profiles, and audit log schemas:

```bash
cd backend
alembic upgrade head
python -m app.seed
```

### DuckDB In-Memory OLAP Database
DuckDB builds an optimized embedded database file (`crime_stats.duckdb`) directly from CSV files in `datasets/`.  
To force a manual rebuild:

```bash
cd backend
python -m app.chat.data.loader
```

### Neo4j Graph Database
Ingests crime records, suspect entities, victim networks, FIR nodes, and financial transactions into Neo4j:

```bash
cd backend
python ingest.py
```

---

## 🚀 Deployment

### Backend Deployment (Render / Railway / Fly.io / AWS EC2)

| Parameter | Configuration |
|---|---|
| **Runtime Environment** | Python 3.9+ |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python run.py` |
| **Port Variable** | `PORT` (Defaults to `9000`) |
| **Health Check Endpoint** | `/health` |

### Frontend Deployment (Vercel / Netlify)

| Parameter | Configuration |
|---|---|
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Start Command** | `npm start` |
| **Root Directory** | `frontend/` |

> **Note**: Update `NEXT_PUBLIC_API_URL` and `BACKEND_URL` in the frontend environment variables after deploying the backend to point to your live backend service URL.

---

## 🔐 Security Design & Compliance

1. **Refresh Token Rotation (Single-Use Tokens)**: Refresh tokens are single-use and tracked via unique JWT Identifiers (`jti`). Detecting token reuse triggers immediate invalidation of all related tokens in that user session family to contain potential breach attempts.
2. **Read-Only LLM SQL Execution**: The AI conversational engine executes strictly `SELECT` SQL queries over DuckDB. Modifying data (`INSERT`, `UPDATE`, `DELETE`, `DROP`) is impossible via LLM tool calls.
3. **Parameterized Cypher Injection Protection**: All Neo4j graph queries use parameterized Cypher variables. Dynamic labels and search parameters are validated against pre-approved whitelists.
4. **Comprehensive Security Audit Logging**: Privileged operations (role modifications, permission updates, high-level intelligence searches) generate immutable entries in the PostgreSQL `audit_logs` table.
5. **Account Lockout Protection**: Automatic temporary account lockout is triggered after $N$ failed password authentication attempts.

---

## 📝 License

This software and underlying crime intelligence algorithms are developed for the **Karnataka State Police (KSP)** crime analytics initiative. All rights reserved.
