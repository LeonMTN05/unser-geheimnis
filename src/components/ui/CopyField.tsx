"use client";

import { useState } from "react";

export function CopyField({ value, label, tone = "accent" }: { value: string; label?: string; tone?: "accent" | "warning" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* Clipboard nicht verfügbar — Feld ist markierbar */ }
  };
  const btn = tone === "warning"
    ? "bg-warning text-bg-primary hover:brightness-110"
    : "bg-accent text-bg-primary hover:bg-accent-hover";
  return (
    <div>
      {label && <p className="text-xs font-medium text-text-secondary mb-1.5">{label}</p>}
      <div className="flex bg-bg-secondary border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-accent">
        <input
          type="text"
          readOnly
          value={value}
          aria-label={label || "Link"}
          onClick={(e) => e.currentTarget.select()}
          className="min-w-0 w-full bg-transparent px-4 py-3 text-text-primary text-sm font-mono outline-none truncate"
        />
        <button type="button" onClick={copy} className={`px-4 sm:px-5 font-medium text-sm flex-shrink-0 transition-colors ${btn}`}>
          {copied ? "Kopiert ✓" : "Kopieren"}
        </button>
      </div>
    </div>
  );
}
