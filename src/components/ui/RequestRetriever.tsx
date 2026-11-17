"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base64ToArrayBuffer } from "@/lib/crypto";
import { aesDecrypt, decryptMeta, openFromResponder } from "@/lib/requestCrypto";
import { CopyField } from "./CopyField";

interface Status {
  id: string;
  status: "PENDING_VERIFICATION" | "OPEN" | "ANSWERED";
  message: string | null;
  recipientEmail: string | null;
  invited: boolean;
  expiresAt: string;
  respondedAt: string | null;
}

export function RequestRetriever({ token }: { token: string }) {
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{ url: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/requests/retrieve/${token}`, { cache: "no-store" }).catch(() => null);
    if (!res) return;
    if (res.status === 404) return setError("Diese Anfrage existiert nicht (mehr). Sie ist abgelaufen oder die Antwort wurde bereits abgerufen.");
    if (res.ok) setStatus(await res.json());
  }, [token]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!/^[A-Za-z0-9_-]{100,400}$/.test(hash)) {
      // Fragment ist erst nach der Hydration verfügbar
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Im Link fehlt der private Schlüssel. Bitte öffne den vollständigen Abruf-Link, den du beim Erstellen gespeichert hast.");
      return;
    }
    setPrivateKey(hash);
    load();
  }, [load]);

  // Automatisch aktualisieren, solange noch keine Antwort da ist
  useEffect(() => {
    if (!status || status.status === "ANSWERED" || text || fileData) return;
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [status, load, text, fileData]);

  useEffect(() => () => { if (fileData) URL.revokeObjectURL(fileData.url); }, [fileData]);

  const reveal = async () => {
    if (!privateKey) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/retrieve/${token}`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Abruf fehlgeschlagen.");
      const key = await openFromResponder(privateKey, d.ephemeralPublicKey);
      const plain = await aesDecrypt(key, new Uint8Array(base64ToArrayBuffer(d.iv)), base64ToArrayBuffer(d.encryptedData));
      if (d.type === "FILE") {
        const meta = await decryptMeta(key, d.encryptedMeta);
        // Bewusst octet-stream (siehe SecretRevealer): kein Ausführen im eigenen Origin
        const url = URL.createObjectURL(new Blob([plain], { type: "application/octet-stream" }));
        setFileData({ url, name: meta.name });
      } else {
        setText(new TextDecoder().decode(plain));
      }
    } catch (err) {
      setError(err instanceof Error && err.name !== "OperationError"
        ? err.message
        : "Entschlüsselung fehlgeschlagen. Der Schlüssel im Link passt nicht.");
    } finally {
      setBusy(false);
    }
  };

  const card = "w-full max-w-2xl mx-auto bg-bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl";

  if (error && !text && !fileData) {
    return (
      <div className="w-full max-w-lg mx-auto p-8 text-center border border-danger/30 bg-danger/10 rounded-2xl">
        <h1 className="text-xl font-bold text-danger mb-3">Abruf nicht möglich</h1>
        <p className="text-text-secondary text-sm leading-relaxed">{error}</p>
      </div>
    );
  }

  if (text !== null || fileData) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl mx-auto bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-accent/10 border-b border-accent/20">
          <p className="text-accent font-semibold">Antwort entschlüsselt</p>
          <p className="text-text-muted text-xs">Nur in deinem Browser sichtbar</p>
        </div>
        {fileData ? (
          <div className="p-8 text-center">
            <p className="text-text-primary font-medium text-lg mb-6 break-all">📄 {fileData.name}</p>
            <a href={fileData.url} download={fileData.name}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-bg-primary font-medium px-6 py-3 rounded-xl">
              Datei herunterladen
            </a>
          </div>
        ) : (
          <>
            <div className="bg-bg-secondary px-6 py-3 flex justify-end border-b border-border">
              <button onClick={() => { navigator.clipboard.writeText(text!); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="text-sm font-medium text-text-secondary hover:text-accent">
                {copied ? "Kopiert ✓" : "Inhalt kopieren"}
              </button>
            </div>
            <pre className="p-6 md:p-8 bg-[#0d1224] font-mono text-sm sm:text-base text-text-primary whitespace-pre-wrap break-words">{text}</pre>
          </>
        )}
        <div className="border-t-2 border-danger bg-danger/10 px-6 py-4 text-sm text-danger font-medium">
          🔥 Die Antwort wurde soeben <strong>unwiderruflich vom Server gelöscht</strong>. Sichere den Inhalt jetzt.
        </div>
      </motion.div>
    );
  }

  if (!status) return <div className={`${card} text-center text-text-muted`}>Lade Status…</div>;

  const exp = new Date(status.expiresAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const requestUrl = typeof window !== "undefined" ? `${window.location.origin}/r/${status.id}` : "";

  return (
    <div className={card}>
      <p className="text-accent text-xs font-medium tracking-wide uppercase mb-2">Deine Datenanfrage</p>
      <h1 className="text-2xl sm:text-3xl font-serif text-text-primary mb-4">
        {status.status === "ANSWERED" ? "Antwort ist da" : status.status === "OPEN" ? "Warte auf Antwort…" : "Warte auf E-Mail-Bestätigung"}
      </h1>

      <div className="text-sm text-text-secondary space-y-1 mb-6">
        {status.recipientEmail && <p>Empfänger: <strong className="text-text-primary">{status.recipientEmail}</strong>{status.invited ? " · Einladung versendet" : ""}</p>}
        {status.message && <p className="whitespace-pre-wrap">Nachricht: „{status.message}“</p>}
        <p>Gültig bis {exp} Uhr</p>
      </div>

      {status.status === "ANSWERED" ? (
        <>
          <p className="text-xs text-warning mb-4">Nach dem Anzeigen wird die Antwort sofort und unwiderruflich vom Server gelöscht.</p>
          <button onClick={reveal} disabled={busy}
            className="w-full sm:w-auto px-10 py-4 bg-accent hover:bg-accent-hover text-bg-primary font-bold text-lg rounded-xl disabled:opacity-60">
            {busy ? "Entschlüssele…" : "🔓 Antwort entschlüsseln & anzeigen"}
          </button>
        </>
      ) : status.status === "OPEN" ? (
        <>
          {!status.invited && <div className="mb-4"><CopyField label="Anfrage-Link für dein Gegenüber" value={requestUrl} /></div>}
          <p className="text-xs text-text-muted">Diese Seite aktualisiert sich automatisch. Du kannst sie auch schließen und den Abruf-Link später erneut öffnen.</p>
        </>
      ) : (
        <p className="text-sm text-text-secondary">Bestätige zuerst den Code aus der E-Mail an deine Adresse. Erst danach wird die Einladung versendet.</p>
      )}
    </div>
  );
}
