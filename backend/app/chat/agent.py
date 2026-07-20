"""The conversational agent: an OpenRouter tool-calling loop.

Flow per user turn:
  1. system prompt (role + schema card + grounding rules) + prior history + the
     new user message are sent to the agent model with the tool specs.
  2. If the model calls a tool, we execute it via :func:`dispatch_tool`, append
     the tool result, and loop — up to ``MAX_TOOL_ROUNDS`` times.
  3. When the model returns prose, that's the answer. Collected tool provenance
     is returned as ``sources`` (Block 9 explainability).

Conversation memory is *stateless here*: the caller passes recent history and
receives the new turns back to persist. Postgres persistence is layered on in
the router.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field

from app.chat.llm import chat_completion
from app.chat.tools import TOOL_SPECS, dispatch_tool, get_schema_card
from app.chat.fallback import generate_fallback_response
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("chat.agent")

MAX_TOOL_ROUNDS = 5

SYSTEM_PROMPT = """You are CrimeRakshak, an intelligent crime analytics assistant \
for Karnataka State Police investigators, analysts and supervisors. You have two \
core responsibilities:

1. ANSWER DATA QUESTIONS: Provide grounded answers about crime statistics using \
your tools — counts, rankings, trends, district profiles, disposal performance.

2. PROVIDE ANALYTICAL GUIDANCE: Beyond raw numbers, give RICH, USEFUL responses — \
summaries of crime situations, how certain crimes are typically investigated and \
resolved, patterns that emerge from the data, prevention strategies, recommended \
focus areas, and actionable insights for officers. You are allowed and ENCOURAGED \
to provide this guidance whenever asked.

TOOLS AND WHEN TO USE THEM:
- `query_crime_stats`: run DuckDB SQL over the aggregate statistics schema below. \
Use for specific data lookups, rankings, comparisons and trends.
- `district_review_summary`: a district's crime profile and worst crime types.
- `rising_crimes`: crime heads increasing the most year-over-year.
- `crime_trend`: how one crime head changed over recent periods.
- `disposal_analysis`: FIR/chargesheet e-sign completion and Sakala pendency for \
a unit.
- `investigation_support`: an ACTIONABLE decision-support briefing for a district \
— its risk profile, standout crime concerns, and administrative bottlenecks, with \
recommended focus areas. Use this whenever the user asks for investigation support, \
decision support, recommendations, priorities, what to focus on, or an action plan \
for a district.
- `case_summary`: get a comprehensive case summary for a specific FIR (by fir_id).
- `investigation_timeline`: get the investigation timeline and prior offenses of the accused for an FIR (by fir_id).
- `similar_cases`: list similar past cases sharing accused or crime categories with an FIR (by fir_id).
- `suggest_leads`: generate recommended investigative leads (associates/shared identifiers) for an FIR (by fir_id).

ALWAYS CALL A TOOL FIRST before answering any question about crime data. \
Pull the actual numbers or graph data before giving any analysis.

WHAT YOU CAN AND SHOULD RESPOND TO:
- "Summarize crime in Bengaluru" → call district_review_summary, then write a \
rich summary paragraph covering total cases, top crime types, trends, and what \
it means for policing priorities.
- "How can rape/murder/theft cases be solved or reduced?" → first query the \
relevant stats, then provide a structured response: the data context (how many \
cases, which districts are worst), investigation best practices for that crime \
type (evidence collection, witness strategies, inter-agency coordination, etc.), \
prevention strategies, and recommended administrative actions based on disposal/\
pendency data.
- "What should police focus on in Mysuru?" → call investigation_support and \
provide a full decision-support briefing.
- "Which crimes are rising?" → call rising_crimes, then explain what the trends \
mean and what interventions are appropriate.
- "Give me an action plan for Belagavi" → call multiple tools, then synthesize \
into a prioritized action plan.
- "Summarize case FIR-2026-0001" or "What is going on with case FIR-2026-0002" → call case_summary, then investigation_timeline to provide a complete status report.
- "Are there any similar cases to FIR-2026-0003?" or "Who should we investigate for case FIR-2026-0004?" → call similar_cases or suggest_leads to provide investigator support.
- Any question about crime trends, patterns, comparisons, or recommendations.

GUIDANCE FRAMEWORK — when asked how cases can be solved or what should be done \
about a crime type, structure your response as:

SITUATION: [What the data shows — case counts, district breakdown, trend direction]

INVESTIGATION APPROACH: [Key investigation steps for this crime type — e.g., for \
rape cases: victim support, medical evidence, CCTV, witness statements, accused \
background check, fast-track court referral; for cyber crime: digital forensics, \
IP tracing, bank-account freezing; for theft: CCTV, pawn-shop alerts, fingerprints]

ADMINISTRATIVE ACTION: [What the disposal/pendency data suggests — push e-sign \
completion, clear chargesheet backlogs, address Sakala pendency]

PREVENTION: [Community policing, hotspot patrolling, awareness programs, \
inter-district coordination where crimes are geographically clustered]

LANGUAGE:
- You MUST respond in the language requested by the user.
- If the user asks in Kannada (ಕನ್ನಡ), or says "ಕನ್ನಡದಲ್ಲಿ ಹೇಳಿ" or "tell me in Kannada" \
or "Karnataka language", reply ENTIRELY in Kannada script for all prose.
- If the selected language is Kannada, write your full response in ಕನ್ನಡ — \
including section labels, sentences, recommendations and explanations.
- Keep district names, crime-type names and numeric figures in their standard \
form even in Kannada responses (e.g. "ಬೆಂಗಳೂರು", "331 ಪ್ರಕರಣಗಳು").
- If no language is specified, respond in English by default.

WRITING STYLE (important):
- Write in clean PLAIN TEXT — no markdown syntax at all. Do NOT use tables, \
'#' headings, '**' bold, or '*' emphasis. These render as raw symbols for the \
user and look broken.
- Use flowing sentences and short paragraphs. Weave key figures into prose \
(e.g. "Cyber crime is the biggest concern with 331 reported cases, followed by \
theft at 738.").
- If you must list separate points, use simple lines starting with "- " (a dash \
and a space) and nothing else.
- Optionally use a short word followed by a colon as a section label \
(e.g. "SITUATION:", "INVESTIGATION APPROACH:", or in Kannada: "ಪರಿಸ್ಥಿತಿ:", \
"ತನಿಖಾ ವಿಧಾನ:") instead of markdown headings.
- Be thorough but readable — like a detailed briefing note an officer would \
actually find useful. Do NOT give one-line answers to complex questions.

DATA NOTE: For general district/state trends, use aggregate statistics tools (e.g. `query_crime_stats`, `district_review_summary`). For questions about specific cases (FIRs), accused persons, victims, timelines, leads, or similar cases, use the case-level graph tools (`case_summary`, `investigation_timeline`, `similar_cases`, `suggest_leads`).

Cite only figures returned by tools. If the data cannot answer a specific aspect, \
say so and provide the general guidance anyway.

=== AGGREGATE STATISTICS SCHEMA (for query_crime_stats) ===
{schema_card}
"""


@dataclass
class AgentTurn:
    answer: str
    sources: list[str] = field(default_factory=list)
    # New messages produced this turn (assistant + tool msgs) for persistence.
    new_messages: list[dict] = field(default_factory=list)
    tool_calls: int = 0
    # Structured reasoning trace (Block 9 explainability): one entry per tool
    # execution — tool name, arguments, SQL, row count, timing, status.
    trace: list[dict] = field(default_factory=list)


def _system_message(language: str = "en") -> dict:
    base = SYSTEM_PROMPT.format(schema_card=get_schema_card())
    if language == "kn":
        # Prepend a clear Kannada instruction so the model always honours it.
        prefix = (
            "IMPORTANT: The user has selected KANNADA as their language. "
            "You MUST write your ENTIRE response in Kannada script (ಕನ್ನಡ). "
            "All prose, section labels, explanations and recommendations must be in Kannada. "
            "Only district names, crime-type names and numbers may stay in their standard form.\n\n"
        )
        base = prefix + base
    return {"role": "system", "content": base}


def run_agent(user_message: str, history: list[dict] | None = None, language: str = "en") -> AgentTurn:
    """Run one user turn through the tool-calling loop.

    Args:
        user_message: The user's question (already translated to English if needed).
        history: Prior conversation messages for context.
        language: Response language code ('en' or 'kn'). Passed from the router
                  so the system prompt can instruct the model to reply in Kannada.
    """
    try:
        # Check if API key is REPLACE_ME or empty to fail fast and use fallback
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "REPLACE_ME":
            raise RuntimeError("API key placeholder detected")

        history = history or []
        messages: list[dict] = [_system_message(language), *history,
                                {"role": "user", "content": user_message}]
        new_messages: list[dict] = [{"role": "user", "content": user_message}]
        sources: list[str] = []
        trace: list[dict] = []
        tool_calls = 0

        for _ in range(MAX_TOOL_ROUNDS):
            resp = chat_completion(messages, model=settings.LLM_AGENT_MODEL, tools=TOOL_SPECS)
            choice = resp.choices[0].message

            # Build the assistant message manually instead of using model_dump().
            # model_dump(exclude_none=True) on Gemini responses can produce tool_calls
            # entries where function.name is missing/empty, causing:
            #   400 function_response.name: Name cannot be empty
            # on the next round. We rebuild the dict explicitly to guarantee the
            # name field is always present.
            if choice.tool_calls:
                assistant_msg: dict = {
                    "role": "assistant",
                    "content": choice.content or "",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in choice.tool_calls
                        if tc.function.name  # skip any malformed entries
                    ],
                }
            else:
                assistant_msg = {
                    "role": "assistant",
                    "content": choice.content or "",
                }

            messages.append(assistant_msg)
            new_messages.append(assistant_msg)

            if not choice.tool_calls:
                return AgentTurn(
                    answer=choice.content or "",
                    sources=sources,
                    new_messages=new_messages,
                    tool_calls=tool_calls,
                    trace=trace,
                )

            # Execute each requested tool and feed results back.
            for tc in choice.tool_calls:
                if not tc.function.name:
                    logger.warning("Skipping tool call with empty function name (id=%s)", tc.id)
                    continue
                tool_calls += 1
                started = time.perf_counter()
                try:
                    result, refs = dispatch_tool(tc.function.name, tc.function.arguments)
                except Exception as exc:
                    logger.error("Tool %s raised: %s", tc.function.name, exc, exc_info=True)
                    result = {"error": f"Tool execution failed: {exc}"}
                    refs = []
                duration_ms = round((time.perf_counter() - started) * 1000)
                sources.extend(refs)

                # Structured trace step for the explainability UI.
                try:
                    args = json.loads(tc.function.arguments or "{}")
                except json.JSONDecodeError:
                    args = {}
                is_error = isinstance(result, dict) and "error" in result
                trace.append({
                    "step": tool_calls,
                    "tool": tc.function.name,
                    "arguments": {k: v for k, v in args.items() if k != "sql"},
                    "sql": (result.get("sql") if isinstance(result, dict) else None) or args.get("sql"),
                    "row_count": result.get("row_count") if isinstance(result, dict) else None,
                    "duration_ms": duration_ms,
                    "status": "error" if is_error else "ok",
                    "detail": result.get("error") if is_error else None,
                })

                tool_msg = {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": tc.function.name,   # required by Gemini; must not be empty
                    "content": _truncate_json(result),
                }
                messages.append(tool_msg)
                new_messages.append(tool_msg)

        # Exhausted tool rounds — ask for a final answer with no more tools.
        resp = chat_completion(messages, model=settings.LLM_AGENT_MODEL)
        answer = resp.choices[0].message.content or "I couldn't complete that request."
        new_messages.append({"role": "assistant", "content": answer})
        return AgentTurn(answer=answer, sources=sources, new_messages=new_messages,
                         tool_calls=tool_calls, trace=trace)
    except Exception as exc:
        logger.warning("LLM agent run failed, invoking offline fallback handler: %s", exc)
        started = time.perf_counter()
        answer, sources = generate_fallback_response(user_message)
        new_messages = [
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": answer}
        ]
        fallback_trace = [{
            "step": 1,
            "tool": "offline_fallback",
            "arguments": {},
            "sql": None,
            "row_count": None,
            "duration_ms": round((time.perf_counter() - started) * 1000),
            "status": "ok",
            "detail": "LLM unreachable — rule-based answer computed from local DuckDB data.",
        }]
        return AgentTurn(answer=answer, sources=sources, new_messages=new_messages,
                         tool_calls=0, trace=fallback_trace)



def _truncate_json(obj, limit: int = 8000) -> str:
    import json

    text = json.dumps(obj, default=str)
    if len(text) > limit:
        return text[:limit] + '…"[truncated]"'
    return text
