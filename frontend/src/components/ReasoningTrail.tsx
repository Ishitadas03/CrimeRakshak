"use client";

// Explainable AI — visual reasoning path for assistant answers.
// Renders the structured tool-execution trace returned by POST /chat as a
// numbered vertical timeline: tool → arguments → SQL → rows → timing.

import { useState } from "react";
import {
  Brain, ChevronDown, ChevronRight, Database, Clock, Table2,
  Wrench, AlertTriangle, FileSearch, TrendingUp, ClipboardList, WifiOff,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";

export interface TraceStep {
  step: number;
  tool: string;
  arguments: Record<string, unknown>;
  sql: string | null;
  row_count: number | null;
  duration_ms: number;
  status: string;
  detail: string | null;
}

const TOOL_META: Record<string, { icon: typeof Wrench; label: string; blurb: string }> = {
  query_crime_stats: { icon: Database, label: "SQL Query", blurb: "Ran read-only SQL over the crime statistics database" },
  district_review_summary: { icon: FileSearch, label: "District Review", blurb: "Pulled the district's crime profile and worst crime heads" },
  rising_crimes: { icon: TrendingUp, label: "Rising Crimes", blurb: "Computed year-over-year increases across crime heads" },
  crime_trend: { icon: TrendingUp, label: "Crime Trend", blurb: "Compared one crime head across recent periods" },
  disposal_analysis: { icon: ClipboardList, label: "Disposal Analysis", blurb: "Checked e-sign completion and Sakala pendency" },
  investigation_support: { icon: FileSearch, label: "Decision Support", blurb: "Assembled the district decision-support briefing" },
  offline_fallback: { icon: WifiOff, label: "Offline Fallback", blurb: "LLM unreachable — rule-based answer from local data" },
};

export default function ReasoningTrail({ trace, t }: { trace: TraceStep[]; t?: (s: string) => string }) {
  const [open, setOpen] = useState(false);
  const [openSql, setOpenSql] = useState<number | null>(null);
  const tr = t ?? ((s: string) => s);
  if (!trace || trace.length === 0) return null;

  const totalMs = trace.reduce((s, x) => s + (x.duration_ms || 0), 0);
  const hasError = trace.some((x) => x.status === "error");

  return (
    <div className="mt-1.5 w-full">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-purple hover:underline px-1"
      >
        <Brain className="h-3.5 w-3.5" />
        {tr("How was this answered?")}
        <span className="text-muted-foreground font-normal">
          · {trace.length} {tr(trace.length === 1 ? "step" : "steps")} · {totalMs} ms
        </span>
        {hasError && <AlertTriangle className="h-3 w-3 text-brand-amber" />}
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-1 border-l-2 border-brand-purple/25 pl-4 space-y-3 pb-1">
              {trace.map((s) => {
                const meta = TOOL_META[s.tool] ?? { icon: Wrench, label: s.tool, blurb: "" };
                const Icon = meta.icon;
                const args = Object.entries(s.arguments || {}).filter(([k]) => k !== "sql");
                return (
                  <div key={s.step} className="relative">
                    {/* timeline dot */}
                    <span className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 ${
                      s.status === "error"
                        ? "bg-brand-red border-brand-red/40"
                        : "bg-brand-purple border-brand-purple/40"
                    }`} />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">#{s.step}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground/90">
                        <Icon className="h-3.5 w-3.5 text-brand-purple" /> {tr(meta.label)}
                      </span>
                      {s.row_count != null && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                          <Table2 className="h-3 w-3" /> {s.row_count} {tr("rows")}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                        <Clock className="h-3 w-3" /> {s.duration_ms} ms
                      </span>
                      {s.status === "error" && (
                        <span className="text-[10px] font-bold text-brand-red uppercase">{tr("failed")}</span>
                      )}
                    </div>
                    {meta.blurb && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{tr(meta.blurb)}</p>
                    )}
                    {args.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {args.map(([k, v]) => (
                          <span key={k} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/40 border border-border/40 text-foreground/80">
                            {k}: {String(v).slice(0, 40)}
                          </span>
                        ))}
                      </div>
                    )}
                    {s.sql && (
                      <div className="mt-1.5">
                        <button
                          onClick={() => setOpenSql(openSql === s.step ? null : s.step)}
                          className="text-[10px] font-bold text-brand-teal hover:underline flex items-center gap-1"
                        >
                          <Database className="h-3 w-3" />
                          {openSql === s.step ? tr("Hide SQL") : tr("Show SQL")}
                        </button>
                        {openSql === s.step && (
                          <pre className="mt-1 p-2 rounded-lg bg-black/80 text-green-300 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all">
                            {s.sql}
                          </pre>
                        )}
                      </div>
                    )}
                    {s.detail && s.status === "error" && (
                      <p className="text-[10px] text-brand-red mt-1 font-mono">{s.detail}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
