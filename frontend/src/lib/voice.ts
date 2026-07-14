// Browser voice utilities: text-to-speech (TTS) and speech-to-text (STT).
// Uses the Web Speech API (SpeechSynthesis + SpeechRecognition). Works in
// Chrome/Edge. Kannada uses the "kn-IN" locale when a voice is available.

export type VoiceLang = "en" | "kn";

const localeFor = (lang: VoiceLang) => (lang === "kn" ? "kn-IN" : "en-IN");

// ── Text-to-speech ────────────────────────────────────────────────────────
export function speak(text: string, lang: VoiceLang = "en", onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  // Strip source/citation block and bullets for cleaner speech.
  const clean = text.split("\n---\n")[0].replace(/[•\-–]/g, " ").replace(/\s+/g, " ").trim();

  const utter = new SpeechSynthesisUtterance(clean);
  const locale = localeFor(lang);
  utter.lang = locale;

  const voices = window.speechSynthesis.getVoices();
  const match =
    voices.find((v) => v.lang === locale) ||
    voices.find((v) => v.lang.startsWith(lang === "kn" ? "kn" : "en"));
  if (match) utter.voice = match;
  utter.rate = 1;
  if (onEnd) utter.onend = onEnd;

  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// ── Speech-to-text ──────────────────────────────────────────────────────────
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

/**
 * Start listening for a single utterance. Calls onResult with the transcript.
 * Returns a stop() function.
 */
export function listen(
  lang: VoiceLang,
  onResult: (text: string) => void,
  onError?: (msg: string) => void,
  onEnd?: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
      .SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .webkitSpeechRecognition;
  if (!Ctor) {
    onError?.("Speech recognition is not supported in this browser.");
    return () => {};
  }

  const recognition = new Ctor();
  recognition.lang = localeFor(lang);
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: SpeechRecognitionEventLike) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };
  recognition.onerror = (event: { error?: string }) => onError?.(event.error || "recognition error");
  recognition.onend = () => onEnd?.();

  recognition.start();
  return () => recognition.stop();
}

// Minimal typings for the Web Speech API (not in the DOM lib by default).
interface SpeechRecognitionEventLike {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (event: SpeechRecognitionEventLike) => void;
  onerror: (event: { error?: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}
