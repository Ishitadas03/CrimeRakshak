# Conversational Crime Intelligence (Blocks 1 & 6)

Natural-language chat over KSP crime data with grounded, cited answers.
Investigator decision support runs on **real aggregate CSV statistics** (DuckDB)
and **case-level graph data** (Neo4j, currently synthetic).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/chat` | Ask a question (English or Kannada). Returns a grounded answer + `sources`. |
| `GET`  | `/api/v1/chat/{conversation_id}/pdf` | Download the conversation transcript as a local PDF. |

Both require an authenticated active user.

### Request
```json
POST /api/v1/chat
{ "message": "Which crimes are rising the most?", "language": "en" }
```
`language`: `"en"` or `"kn"` (Kannada). Pass `conversation_id` on follow-ups for
context-aware memory.

## How it works

```
message (en/kn) ─► [KN→EN] ─► tool-calling agent (OpenRouter)
                                 ├─ query_crime_stats        (DuckDB, real stats)
                                 ├─ district_review_summary / rising_crimes /
                                 │  crime_trend / disposal_analysis  (DuckDB, Block 6)
                                 └─ case_summary / investigation_timeline /
                                    similar_cases / suggest_leads     (Neo4j, Block 6)
                            grounded rows + provenance ─► answer ─► [EN→KN] ─► PDF
```

The LLM never writes to the DB and never runs raw SQL blindly: `query_crime_stats`
is validated **SELECT-only**, and every answer carries `sources` (the SQL / graph
query used) for explainability (Block 9).

## Setup

1. `pip install -r requirements.txt`
2. Set in `backend/.env`: `OPENROUTER_API_KEY` (required), optionally
   `LLM_AGENT_MODEL`, `LLM_SUMMARY_MODEL`, `LLM_MAX_TOKENS`.
3. Build the CSV analytics DB: `python -m app.chat.data.loader`
   (auto-runs on first request; regenerates `crime_stats.duckdb` from `datasets/`).
4. (Optional) Start Neo4j + load synthetic case data for the case-level tools;
   without it those tools return a graceful "graph database unavailable".
5. `uvicorn app.main:app --reload` → try it at `/docs`.

## Files

- `data/loader.py` — curated CSV → DuckDB tables
- `data/schema_card.py` — schema description injected into the LLM prompt
- `data/query.py` — safe SELECT-only executor
- `llm.py` — OpenRouter client
- `tools.py` — tool registry + dispatch (all 9 tools)
- `agent.py` — tool-calling loop with conversation memory
- `graph_tools.py` — Block 6 case-level tools (Neo4j)
- `decision_tools.py` — Block 6 analytics tools (DuckDB/CSV)
- `translate.py` — Kannada ⇄ English
- `pdf.py` — transcript → PDF (Unicode/Kannada font)
- `router.py` — FastAPI endpoints
