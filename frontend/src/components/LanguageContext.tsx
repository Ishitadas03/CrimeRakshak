"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { type Lang, t as translateFn } from "@/lib/translations";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("EN");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Optionally, read from localStorage
    const savedLang = localStorage.getItem("app-lang") as Lang;
    if (savedLang === "EN" || savedLang === "KA") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(savedLang);
    }
    setMounted(true);
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("app-lang", newLang);
  };

  const t = (key: string) => translateFn(key, mounted ? lang : "EN");

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
