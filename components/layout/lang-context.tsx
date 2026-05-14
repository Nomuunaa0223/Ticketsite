"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { Lang } from "@/lib/i18n";
import { dict } from "@/lib/i18n";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof typeof dict.en) => string;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  function setLang(newLang: Lang) {
    setLangState(newLang);
    document.cookie = `lang=${newLang};path=/;max-age=31536000`;
    document.documentElement.lang = newLang;
  }

  function t(key: keyof typeof dict.en): string {
    return dict[lang][key] ?? dict.en[key] ?? key;
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error("useLang must be used within a LangProvider");
  }
  return ctx;
}
