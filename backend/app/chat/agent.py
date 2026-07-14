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

from dataclasses import dataclass, field

from app.chat.llm import chat_completion
from app.chat.tools import TOOL_SPECS, dispatch_tool, get_schema_card
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("chat.agent")

MAX_TOOL_ROUNDS = 5

SYSTEM_PROMPT = """You are CrimeRakshak, an assistant for Karnataka State \
Police investigators, analysts and supervisors. You answer questions about \
crime using ONLY grounded data returned by your tools — never invent numbers.

TOOLS AND WHEN TO USE THEM:
- `query_crime_stats`: run DuckDB SQL over the aggregate statistics schema \
below. Use for specific data lookups, rankings, comparisons and trends.
- `district_review_summary`: a district's crime profile and worst crime types.
- `rising_crimes`: crime heads increasing the most year-over-year.
- `crime_trend`: how one crime head changed over recent periods.
- `disposal_analysis`: FIR/chargesheet e-sign completion and Sakala pendency \
for a unit.
- `investigation_support`: an ACTIONABLE decision-support briefing for a \
district — its risk profile, standout crime concerns, and administrative \
bottlenecks, with recommended focus areas. Use this whenever the user asks for \
investigation support, decision support, recommendations, priorities, what to \
focus on, or an action plan for a district.

WRITING STYLE (important):
- Write in clean PLAIN TEXT — no markdown syntax at all. Do NOT use tables, \
'#' headings, '**' bold, or '*' emphasis. These render as raw symbols for the \
user and look broken.
- Use flowing sentences and short paragraphs. Weave key figures into prose \
(e.g. "Cyber crime is the biggest concern with 331 reported cases, followed by \
theft at 738.").
- If you must list separate recommendations, use simple lines starting with \
"- " (a dash and a space) and nothing else.
- Optionally use a short ALL-CAPS word followed by a colon as a section label \
(e.g. "CRIME PROFILE:") instead of markdown headings.
- Be concise and readable, like a briefing note an officer would actually read.

DATA NOTE: all figures are AGGREGATE reported-case counts, not individual case \
records. There is no per-FIR, per-accused or per-victim data. If asked about a \
specific FIR, person or victim, explain that only aggregate statistics are \
available and offer district/crime-type analysis instead.

Cite only figures returned by tools. If the data cannot answer, say so plainly.

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


def _system_message() -> dict:
    return {"role": "system", "content": SYSTEM_PROMPT.format(schema_card=get_schema_card())}


def run_agent(user_message: str, history: list[dict] | None = None) -> AgentTurn:
    """Run one user turn through the tool-calling loop."""
    history = history or []
    messages: list[dict] = [_system_message(), *history,
                            {"role": "user", "content": user_message}]
    new_messages: list[dict] = [{"role": "user", "content": user_message}]
    sources: list[str] = []
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
            )

        # Execute each requested tool and feed results back.
        for tc in choice.tool_calls:
            if not tc.function.name:
                logger.warning("Skipping tool call with empty function name (id=%s)", tc.id)
                continue
            tool_calls += 1
            try:
                result, refs = dispatch_tool(tc.function.name, tc.function.arguments)
            except Exception as exc:
                logger.error("Tool %s raised: %s", tc.function.name, exc, exc_info=True)
                result = {"error": f"Tool execution failed: {exc}"}
                refs = []
            sources.extend(refs)
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
    return AgentTurn(answer=answer, sources=sources, new_messages=new_messages, tool_calls=tool_calls)



def _truncate_json(obj, limit: int = 8000) -> str:
    import json

    text = json.dumps(obj, default=str)
    if len(text) > limit:
        return text[:limit] + '…"[truncated]"'
    return text
