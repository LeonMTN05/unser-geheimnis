"use client";

import { useEffect, useState } from "react";
import { getRetrieval } from "@/lib/requestStore";

/** Öffnet den im Browser gemerkten Abruf-Link zu einer Anfrage (Link aus der Benachrichtigungs-Mail). */
export function OpenStoredRequest({ id }: { id: string | null }) {
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const url = id ? getRetrieval(id) : null;
    // Nur eigene Abruf-Links öffnen
    if (url && url.startsWith(`${window.location.origin}/abruf/`)) {
      window.location.replace(url);
    } else {
      // localStorage ist erst im Browser verfügbar
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMissing(true);
    }
  }, [id]);

  if (!missing) {
    return <p className="text-text-muted">Antwort wird geöffnet…</p>;
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-bg-card border border-border rounded-2xl p-8 shadow-xl text-center">
      <h1 className="text-2xl font-serif text-text-primary mb-3">Schlüssel nicht in diesem Browser</h1>
      <p className="text-text-secondary text-sm leading-relaxed mb-4">
        Der Schlüssel zum Entschlüsseln ist nur in dem Browser gespeichert, in dem du die Anfrage erstellt hast.
        Öffne den Link dort, oder nutze deinen gespeicherten <strong className="text-text-primary">Abruf-Link</strong>.
      </p>
      <p className="text-text-muted text-xs leading-relaxed">
        Aus Sicherheitsgründen kennen wir den Schlüssel nicht und können ihn nicht erneut zusenden.
        Ohne Abruf-Link lässt sich die Antwort nicht öffnen; sie wird mit Ablauf der Anfrage automatisch gelöscht.
      </p>
    </div>
  );
}
