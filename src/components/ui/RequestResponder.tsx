"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { arrayBufferToBase64 } from "@/lib/crypto";
import { aesEncrypt, encryptMeta, sealForRequester } from "@/lib/requestCrypto";
import { MAX_TEXT_LENGTH } from "@/lib/constants";

const MAX_FILE_SIZE = 16 * 1024 * 1024;

interface Info {
  status: "OPEN" | "ANSWERED";
  publicKey?: string;
  message?: string | null;
  requesterName?: string | null;
  requesterEmail?: string | null;
  verified?: boolean;
  expiresAt?: string;
}

export function RequestResponder({ id }: { id: string }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<"TEXT" | "FILE">("TEXT");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/requests/${id}`, { cache: "no-store" })
      .then(async (r) => (r.ok ? setInfo(await r.json()) : setLoadError(true)))
      .catch(() => setLoadError(true));
  }, [id]);

  const pickFile = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) return setError("Die Datei ist zu groß (maximal 16 MB).");
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info?.publicKey) return;
    if (tab === "TEXT" && !text.trim()) return setError("Bitte gib die angeforderten Daten ein.");
    if (tab === "FILE" && !file) return setError("Bitte wähle eine Datei aus.");
    setBusy(true);
    setError(null);
    try {
      const { aesKey, ephemeralPublicKey } = await sealForRequester(info.publicKey);
      let res: Response;
      if (tab === "TEXT") {
        const { iv, ciphertext } = await aesEncrypt(aesKey, new TextEncoder().encode(text));
        res = await fetch(`/api/requests/${id}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "TEXT", encryptedData: arrayBufferToBase64(ciphertext), iv: arrayBufferToBase64(iv), ephemeralPublicKey }),
        });
      } else {
        const { iv, ciphertext } = await aesEncrypt(aesKey, await file!.arrayBuffer());
        const fd = new FormData();
        fd.append("iv", arrayBufferToBase64(iv));
        fd.append("ephemeralPublicKey", ephemeralPublicKey);
        fd.append("encryptedMeta", await encryptMeta(aesKey, { name: file!.name, mime: file!.type || "application/octet-stream" }));
        fd.append("file", new Blob([ciphertext]));
        res = await fetch(`/api/requests/${id}/respond`, { method: "POST", body: fd });
      }
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Übermittlung fehlgeschlagen.");
      setText("");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Übermittlung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const card = "w-full max-w-2xl mx-auto bg-bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl";

  if (loadError) {
    return (
      <div className="w-full max-w-lg mx-auto p-8 text-center border border-danger/30 bg-danger/10 rounded-2xl">
        <h1 className="text-xl font-bold text-danger mb-3">Diese Anfrage existiert nicht (mehr)</h1>
        <p className="text-text-secondary text-sm">Sie ist abgelaufen, wurde gelöscht oder der Link ist unvollständig.</p>
      </div>
    );
  }
  if (!info) return <div className={`${card} text-center text-text-muted`}>Lade Anfrage…</div>;

  if (info.status === "ANSWERED" || done) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${card} text-center`}>
        <div className="text-4xl mb-4" aria-hidden="true">✓</div>
        <h1 className="text-2xl font-serif text-text-primary mb-3">
          {done ? "Sicher übermittelt" : "Diese Anfrage wurde bereits beantwortet"}
        </h1>
        <p className="text-text-secondary text-sm max-w-md mx-auto leading-relaxed">
          {done
            ? "Deine Daten wurden in deinem Browser verschlüsselt. Nur der Anfragende kann sie mit seinem privaten Schlüssel öffnen; danach werden sie gelöscht. Du kannst dieses Fenster schließen."
            : "Es kann nur eine Antwort übermittelt werden."}
        </p>
      </motion.div>
    );
  }

  const exp = info.expiresAt
    ? new Date(info.expiresAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <form onSubmit={submit} className={card}>
      <p className="text-accent text-xs font-medium tracking-wide uppercase mb-2">Datenanfrage</p>
      <h1 className="text-2xl sm:text-3xl font-serif text-text-primary mb-5">Jemand bittet dich um vertrauliche Daten</h1>

      {/* Wer fragt an? */}
      <div className="mb-5 rounded-xl border border-border bg-bg-secondary p-4 text-sm">
        <p className="text-text-muted text-xs mb-1">Angefordert von</p>
        <p className="text-text-primary font-medium break-words">
          {info.requesterName || (info.requesterEmail ? "" : "Unbekannt")}
          {info.requesterName && info.requesterEmail ? " · " : ""}
          {info.requesterEmail}
        </p>
        {info.verified ? (
          <p className="mt-1 text-xs text-success">✓ E-Mail-Adresse des Absenders wurde bestätigt</p>
        ) : (
          <p className="mt-1 text-xs text-warning">Absender nicht verifiziert: Der Link wurde direkt geteilt. Name und Nachricht sind Angaben des Erstellers.</p>
        )}
        {info.message && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-text-muted text-xs mb-1">Nachricht</p>
            <p className="text-text-primary whitespace-pre-wrap break-words">{info.message}</p>
          </div>
        )}
      </div>

      {/* Sicherheitshinweis */}
      <div className="mb-6 rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs text-text-secondary leading-relaxed">
        <p className="font-semibold text-warning mb-1">Bevor du etwas eingibst</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Prüfe die Adresszeile: Dort muss exakt <strong className="text-text-primary">unser-geheimnis.de</strong> stehen.</li>
          <li>Übermittle nur Daten, wenn du den Anfragenden kennst und die Anfrage erwartet hast. Im Zweifel: über einen bekannten Kontaktweg nachfragen.</li>
          <li>Die Daten werden in deinem Browser verschlüsselt. Nur der Anfragende kann sie lesen, auch wir nicht.</li>
        </ul>
      </div>

      <div className="mb-4 flex gap-2 border-b border-border" role="tablist">
        {(["TEXT", "FILE"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`px-4 py-3 font-medium transition-colors ${tab === t ? "border-b-2 border-accent text-accent" : "text-text-secondary hover:text-text-primary"}`}>
            {t === "TEXT" ? "📝 Text" : "📎 Datei"}
          </button>
        ))}
      </div>

      {tab === "TEXT" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
          disabled={busy}
          aria-label="Angeforderte Daten"
          placeholder="Zugangsdaten, Passwort, API-Key…"
          className="w-full h-40 p-4 bg-bg-secondary border border-border rounded-xl focus:ring-2 focus:ring-accent outline-none font-mono text-sm text-text-primary resize-y mb-6"
        />
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); pickFile(e.dataTransfer.files?.[0]); }}
          onClick={() => fileRef.current?.click()}
          className={`w-full h-40 mb-6 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all ${isDragging ? "border-accent bg-accent/5" : "border-border hover:border-text-muted bg-bg-secondary"}`}
        >
          <input type="file" ref={fileRef} className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
          {file ? (
            <div className="text-center px-4">
              <p className="font-medium text-text-primary truncate max-w-xs">📄 {file.name}</p>
              <p className="text-xs text-text-secondary mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="text-center px-4">
              <p className="text-sm text-text-primary">Datei hierher ziehen oder klicken</p>
              <p className="text-xs text-text-secondary mt-1">Maximal 16 MB</p>
            </div>
          )}
        </div>
      )}

      {error && <div role="alert" className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">{error}</div>}

      <button type="submit" disabled={busy}
        className="w-full bg-accent hover:bg-accent-hover text-bg-primary font-bold text-lg py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-70">
        {busy ? "Verschlüssele & übermittle…" : "🔒 Verschlüsselt übermitteln"}
      </button>
      {exp && <p className="mt-3 text-center text-xs text-text-muted">Anfrage gültig bis {exp} Uhr · Es ist nur eine Antwort möglich</p>}
    </form>
  );
}
