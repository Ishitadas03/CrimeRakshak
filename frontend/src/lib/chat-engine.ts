// CrimeScope AI 2.0 — Rule-based Chat Engine
// Pattern-matching NLQ responder over local dataset.
// Swap for real LLM API later.

import { districts, ipcCrimes, stateTotals } from "@/data/crimeData";
import { getTopDistricts, getSafestDistricts, getRiskTier, getMonthOverMonthChange } from "@/lib/derive";
import type { TraceStep } from "@/components/ReasoningTrail";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
  trace?: TraceStep[];
}

export const examplePrompts = [
  "Which district is safest?",
  "Show top 5 high-crime districts",
  "What is the most common crime?",
  "Show Bengaluru crime stats",
  "Total crimes in Karnataka 2025",
  "Crime trend for theft",
];

export function processQuery(query: string, t: (key: string) => string = (k) => k): string {
  const q = query.toLowerCase().trim();

  // Safest district
  if (q.includes("safest") || q.includes("safe district") || q.includes("least crime")) {
    const safest = getSafestDistricts(5);
    return `🛡️ **${t("Safest Districts in Karnataka (2025):")}**\n${safest.map((d, i) => `${i + 1}. **${t(d.name)}** — ${(d.ipc + d.sll).toLocaleString()} ${t("total")} ${t("cases")} (${t(getRiskTier(d))})`).join("\n")}\n\n${t("These districts have the lowest combined IPC + SLL case volumes.")}`;
  }

  // Top crime districts
  if (q.includes("top") && (q.includes("district") || q.includes("high crime") || q.includes("dangerous"))) {
    const n = parseInt(q.match(/\d+/)?.[0] || "5");
    const top = getTopDistricts(Math.min(n, 10));
    return `🚨 **${t("Top High-Crime Districts:")}**\n${top.map((d, i) => `${i + 1}. **${t(d.name)}** — ${(d.ipc + d.sll).toLocaleString()} ${t("cases")} (${t(getRiskTier(d))})`).join("\n")}`;
  }

  // Most common crime
  if (q.includes("most common") || q.includes("highest crime") || q.includes("top crime type")) {
    const sorted = [...ipcCrimes].sort((a, b) => b.total - a.total).slice(0, 5);
    return `📊 **${t("Top Crime Categories (2025):")}**\n${sorted.map((c, i) => `${i + 1}. **${t(c.category)}** — ${c.total.toLocaleString()} ${t("cases")}`).join("\n")}`;
  }

  // District-specific query
  const matchedDistrict = districts.find((d) =>
    q.includes(d.name.toLowerCase())
  );
  if (matchedDistrict) {
    const tier = getRiskTier(matchedDistrict);
    return `📍 **${t(matchedDistrict.name)}**\n- ${t("IPC Cases")}: ${matchedDistrict.ipc.toLocaleString()}\n- ${t("SLL Cases")}: ${matchedDistrict.sll.toLocaleString()}\n- ${t("Total")}: ${(matchedDistrict.ipc + matchedDistrict.sll).toLocaleString()}\n- ${t("Risk Level")}: ${t(tier)}`;
  }

  // Total crimes
  if (q.includes("total") && (q.includes("crime") || q.includes("karnataka"))) {
    return `📈 **${t("Karnataka Crime Statistics (2025):")}**\n- ${t("Total Cases")}: ${stateTotals.total.toLocaleString()}\n- ${t("IPC Cases")}: ${stateTotals.ipc.toLocaleString()}\n- ${t("SLL Cases")}: ${stateTotals.sll.toLocaleString()}\n- ${t("Districts")}: ${districts.length}\n- ${t("Resolution Rate")}: ~68.4%`;
  }

  // Crime trend for specific type
  const crimeMatch = ipcCrimes.find((c) => q.includes(c.category.toLowerCase()));
  if (crimeMatch) {
    const change = getMonthOverMonthChange(crimeMatch.category);
    return `📊 **${t(crimeMatch.category)}:**\n- ${t("Total (2025 YTD)")}: ${crimeMatch.total.toLocaleString()} ${t("cases")}\n- ${t("Month-over-Month Change")}: ${change > 0 ? "+" : ""}${change}%\n${crimeMatch.subcats ? `\n**${t("Subcategories:")}**\n${crimeMatch.subcats.map((s) => `  - ${t(s.name)}: ${s.val.toLocaleString()}`).join("\n")}` : ""}`;
  }

  // Fallback
  return `${t("I can help you with Karnataka crime data analysis. Try asking:")}\n${examplePrompts.map((p) => `• "${t(p)}"`).join("\n")}\n\n${t("_Note: I'm a pattern-matching assistant using local data. For complex queries, a future LLM integration would provide more nuanced answers._")}`;
}
