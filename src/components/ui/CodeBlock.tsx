"use client";

import { useState } from "react";

/** Codeblock mit Kopieren-Button (für die Self-Hosted-Anleitung). */
export function CodeBlock({ code, title, lang = "bash" }: { code: string; title?: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* Clipboard nicht verfügbar */ }
  };
  return (
    <div className="my-4 rounded-xl border border-border bg-[#0d1224] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary/60">
        <span className="font-mono text-xs text-text-muted">{title || lang}</span>
        <button type="button" onClick={copy} className="text-xs font-medium text-text-secondary hover:text-accent transition-colors">
          {copied ? "Kopiert ✓" : "Kopieren"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-text-primary"><code>{code}</code></pre>
    </div>
  );
}
