
import React, { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const getInitialLang = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lang") || "he";
    }
    return "he";
  };
  const [lang, setLangState] = useState(getInitialLang);

  const setLang = (newLang) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", newLang);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
