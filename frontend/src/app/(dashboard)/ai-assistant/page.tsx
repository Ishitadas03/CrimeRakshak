"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { examplePrompts, type ChatMessage } from "@/lib/chat-engine";
import { useLanguage } from "@/components/LanguageContext";
import { speak, stopSpeaking, listen, isSpeechRecognitionSupported } from "@/lib/voice";
import * as motion from "motion/react-client";
import { Send, Sparkles, Bot, User, Volume2, Square, Mic, FileDown, Building2 } from "lucide-react";

const GREETING =
  "Hello! I'm the CrimeRakshak AI Copilot & Decision Support system. Ask me about Karnataka crime data — trends, rankings, district reviews — or open Decision Support for a district briefing.";

// Major Karnataka districts/units for the decision-support selector.
const DISTRICTS = [
  "Bengaluru City", "Mysuru", "Tumakuru", "Belagavi", "Kalaburagi", "Dakshina Kannada",
  "Vijayapur", "Ballari", "Davanagere", "Shivamogga", "Hassan", "Mandya",
  "Udupi", "Dharwad", "Bagalkot", "Chickballapura", "Kolar", "Raichur",
];

export default function AIAssistantPage() {
  const { t, lang } = useLanguage();
  const voiceLang = lang === "KA" ? "kn" : "en";

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [listening, setListening] = useState(false);

  // Decision-support panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [district, setDistrict] = useState(DISTRICTS[1]);
  const [briefing, setBriefing] = useState<string>("");
  const [briefingLoading, setBriefingLoading] = useState(false);

  const conversationId = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stopListenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Warm up voices list (Chrome loads them async).
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
    return () => stopSpeaking();
  }, []);

  async function callChat(message: string): Promise<{ answer: string; sources: string[] }> {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversation_id: conversationId.current,
        language: voiceLang,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || data?.error || `Request failed (${res.status})`);
    conversationId.current = data.conversation_id ?? conversationId.current;
    return { answer: data.answer ?? "(no answer)", sources: data.sources ?? [] };
  }

  const handleSend = async (query?: string) => {
    const q = query || input.trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: q, timestamp: new Date() }]);
    setInput("");
    setLoading(true);
    try {
      const { answer, sources } = await callChat(q);
      let content = answer;
      if (sources.length > 0) {
        content += "\n---\n📎 Sources:\n" + sources.map((s) => `• ${s}`).join("\n");
      }
      setMessages((prev) => [...prev, { role: "assistant", content, timestamp: new Date() }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Could not reach the AI backend.\n${String(err)}`, timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleListen = (idx: number, text: string) => {
    if (speakingIdx === idx) {
      stopSpeaking();
      setSpeakingIdx(null);
      return;
    }
    setSpeakingIdx(idx);
    speak(text, voiceLang, () => setSpeakingIdx(null));
  };

  const handleMic = () => {
    if (listening) {
      stopListenRef.current?.();
      setListening(false);
      return;
    }
    if (!isSpeechRecognitionSupported()) {
      alert("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    setListening(true);
    stopListenRef.current = listen(
      voiceLang,
      (text) => { setInput(text); setListening(false); },
      (msg) => { console.warn("STT:", msg); setListening(false); },
      () => setListening(false),
    );
  };

  const runBriefing = async () => {
    setBriefingLoading(true);
    setBriefing("");
    try {
      const { answer } = await callChat(`Give me investigation and decision support for ${district} district.`);
      setBriefing(answer);
    } catch (err) {
      setBriefing(`⚠️ Could not load briefing.\n${String(err)}`);
    } finally {
      setBriefingLoading(false);
    }
  };

  const exportPdf = () => {
    if (!conversationId.current) {
      alert("Ask a question first, then export.");
      return;
    }
    window.open(`/api/chat/${conversationId.current}/pdf`, "_blank");
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-brand-purple" /> {t("AI Copilot & Decision Support")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("Natural-language crime data analysis · Decision support · Voice · PDF")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPanelOpen((v) => !v)}>
            <Building2 className="h-4 w-4 mr-1" /> {t("Decision Support")}
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf}>
            <FileDown className="h-4 w-4 mr-1" /> {t("Export PDF")}
          </Button>
        </div>
      </motion.div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Chat */}
        <Card className="glass-card flex-1 flex flex-col min-h-0 hover:!transform-none">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="max-w-[85%] space-y-1">
                  <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                    msg.role === "user" ? "bg-brand-purple text-white rounded-br-md" : "bg-muted/50 rounded-bl-md"
                  }`}>
                    {msg.content === GREETING ? t(GREETING) : msg.content}
                  </div>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => handleListen(i, msg.content)}
                      className="text-xs text-brand-purple hover:underline flex items-center gap-1 px-1"
                    >
                      {speakingIdx === i ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                      {speakingIdx === i ? t("Stop") : t("Listen")}
                    </button>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl px-4 py-3 text-sm bg-muted/50 rounded-bl-md text-muted-foreground animate-pulse">
                  {t("Analyzing crime data...")}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </CardContent>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {examplePrompts.map((p) => (
                <button key={p} onClick={() => handleSend(p)}
                  className="text-xs px-3 py-1.5 rounded-full border border-brand-purple/30 text-brand-purple hover:bg-brand-purple/10 transition-colors">
                  {t(p)}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-border">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Button type="button" size="icon" variant={listening ? "default" : "outline"}
                onClick={handleMic} title={t("Voice input")}
                className={listening ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""}>
                <Mic className="h-4 w-4" />
              </Button>
              <Input value={input} onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? t("Listening...") : t("Ask about crime data, or use the mic...")}
                className="flex-1" disabled={loading} />
              <Button type="submit" size="icon" className="bg-gradient-to-r from-brand-purple to-brand-blue" disabled={!input.trim() || loading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>

        {/* Decision-support panel */}
        {panelOpen && (
          <Card className="glass-card w-full max-w-sm flex flex-col min-h-0 hover:!transform-none hidden lg:flex">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-sm flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-brand-purple" /> {t("District Decision Support")}
                </h2>
                <p className="text-xs text-muted-foreground">{t("Real KSP aggregate statistics")}</p>
              </div>
              <button onClick={() => setPanelOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>
            <div className="p-4 space-y-3">
              <select value={district} onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <Button onClick={runBriefing} disabled={briefingLoading}
                className="w-full bg-gradient-to-r from-brand-purple to-brand-blue">
                {briefingLoading ? t("Building briefing...") : t("Get Decision Briefing")}
              </Button>
            </div>
            <CardContent className="flex-1 overflow-y-auto px-4 pb-4">
              {briefing ? (
                <div className="space-y-2">
                  <div className="text-sm whitespace-pre-wrap">{briefing}</div>
                  <button onClick={() => handleListen(-1, briefing)}
                    className="text-xs text-brand-purple hover:underline flex items-center gap-1">
                    {speakingIdx === -1 ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    {speakingIdx === -1 ? t("Stop") : t("Listen")}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("Select a district and generate a grounded decision-support briefing: crime profile, rising concerns, disposal bottlenecks and recommended focus areas.")}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
