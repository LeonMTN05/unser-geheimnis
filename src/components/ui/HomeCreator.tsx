"use client";

import { useEffect, useState } from "react";
import { SecretCreator } from "./SecretCreator";
import { RequestCreator } from "./RequestCreator";

type Mode = "share" | "request";

export function HomeCreator() {
  const [mode, setMode] = useState<Mode>("share");

  // Direktlink: unser-geheimnis.de/#anfordern
  useEffect(() => {
    const sync = () => window.location.hash === "#anfordern" && setMode("request");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const tab = (m: Mode, label: string, hint: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => setMode(m)}
      className={`flex-1 rounded-xl px-4 py-2.5 text-left transition-colors ${
        mode === m ? "bg-accent text-bg-primary" : "text-text-secondary hover:text-text-primary hover:bg-white/5"
      }`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className={`block text-xs ${mode === m ? "text-bg-primary/75" : "text-text-muted"}`}>{hint}</span>
    </button>
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div role="tablist" aria-label="Modus" className="mb-4 flex gap-1 p-1 rounded-2xl bg-bg-secondary border border-border">
        {tab("share", "Geheimnis teilen", "Du schickst Daten")}
        {tab("request", "Daten anfordern", "Jemand schickt dir Daten")}
      </div>
      {mode === "share" ? <SecretCreator /> : <RequestCreator />}
    </div>
  );
}
