"use client";

import { useState } from "react";

/**
 * Bestätigung per Klick statt automatisch beim Öffnen: E-Mail-Scanner
 * (z. B. Safe Links) rufen Links vorab auf und dürfen nichts auslösen.
 */
export function ConfirmAction(props: {
  title: string;
  description: string;
  button: string;
  endpoint: string;
  body: Record<string, string>;
  success: (data: Record<string, unknown>) => string;
}) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const run = async () => {
    setState("busy");
    try {
      const res = await fetch(props.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(props.body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Das hat nicht geklappt.");
      setMsg(props.success(d));
      setState("done");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Das hat nicht geklappt.");
      setState("error");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-bg-card border border-border rounded-2xl p-8 shadow-xl text-center">
      <h1 className="text-2xl font-serif text-text-primary mb-3">{props.title}</h1>
      {state === "done" ? (
        <p role="status" className="text-success text-sm leading-relaxed">{msg}</p>
      ) : (
        <>
          <p className="text-text-secondary text-sm leading-relaxed mb-6">{props.description}</p>
          <button onClick={run} disabled={state === "busy"}
            className="px-8 py-3 bg-accent hover:bg-accent-hover text-bg-primary font-semibold rounded-xl disabled:opacity-60">
            {state === "busy" ? "Einen Moment…" : props.button}
          </button>
          {state === "error" && <p role="alert" className="mt-4 text-danger text-sm">{msg}</p>}
        </>
      )}
    </div>
  );
}
