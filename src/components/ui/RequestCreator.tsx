"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ExpirySelector } from "./ExpirySelector";
import { CopyField } from "./CopyField";
import { ValidTTL } from "@/lib/constants";
import { generateRequestKeyPair, solvePow, type PowChallenge } from "@/lib/requestCrypto";
import { REQUEST_MESSAGE_MAX, REQUEST_NAME_MAX, containsLink } from "@/lib/requestValidation";

type Pow = PowChallenge & { number: number };
type PowState = { status: "idle" | "solving" | "ready" | "error"; solution?: Pow; fetchedAt?: number };

interface Created {
  id: string;
  status: "OPEN" | "PENDING_VERIFICATION";
  expiresAt: string;
  retrievalUrl: string;
  requestUrl: string;
  sender?: string;
  recipient?: string;
}

const inputCls =
  "w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-text-muted disabled:opacity-60";

async function fetchAndSolve(signal: AbortSignal): Promise<Pow> {
  const res = await fetch("/api/pow", { signal, cache: "no-store" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Sicherheitsprüfung nicht verfügbar.");
  return solvePow(await res.json(), signal);
}

export function RequestCreator() {
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [ttl, setTtl] = useState<ValidTTL>(48);
  const [useEmail, setUseEmail] = useState(false);
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [website, setWebsite] = useState(""); // Honeypot
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [pow, setPow] = useState<PowState>({ status: "idle" });
  const startedAt = useRef(0);
  const powAbort = useRef<AbortController | null>(null);

  // Proof-of-Work vorab im Hintergrund lösen, sobald E-Mail-Versand aktiviert wird
  const startPow = () => {
    powAbort.current?.abort();
    const ctrl = new AbortController();
    powAbort.current = ctrl;
    setPow({ status: "solving" });
    const p = fetchAndSolve(ctrl.signal)
      .then((solution) => { if (!ctrl.signal.aborted) setPow({ status: "ready", solution, fetchedAt: Date.now() }); return solution; })
      .catch((e) => { if (!ctrl.signal.aborted) setPow({ status: "error" }); throw e; });
    return p;
  };
  const toggleEmail = (on: boolean) => {
    setUseEmail(on);
    if (on) startPow().catch(() => {});
    else { powAbort.current?.abort(); setPow({ status: "idle" }); }
  };
  useEffect(() => {
    startedAt.current = Date.now();
    return () => powAbort.current?.abort();
  }, []);

  const linkInText = useEmail && (containsLink(message) || containsLink(name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (useEmail && (!sender || !recipient)) return setError("Bitte beide E-Mail-Adressen angeben.");
    if (useEmail && sender.trim().toLowerCase() === recipient.trim().toLowerCase()) {
      return setError("Absender und Empfänger dürfen nicht identisch sein.");
    }
    if (linkInText) return setError("Links, Domains und E-Mail-Adressen sind in Name und Nachricht nicht erlaubt, wenn per E-Mail versendet wird.");

    setIsSubmitting(true);
    try {
      let solution: Pow | undefined;
      if (useEmail) {
        // Challenge läuft nach 5 Min. ab → ggf. neu lösen
        const fresh = pow.status === "ready" && pow.fetchedAt && Date.now() - pow.fetchedAt < 4 * 60_000;
        solution = fresh ? pow.solution : await startPow();
      }

      const { publicKey, privateKey } = await generateRequestKeyPair();
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey,
          message: message.trim() || undefined,
          requesterName: name.trim() || undefined,
          expiresIn: ttl,
          email: useEmail ? { sender: sender.trim(), recipient: recipient.trim() } : undefined,
          pow: solution,
          website,
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (useEmail) setPow({ status: "idle" }); // Challenge ist verbraucht
        if (useEmail) startPow().catch(() => {});
        throw new Error(data.error || "Die Anfrage konnte nicht erstellt werden.");
      }

      const origin = window.location.origin;
      setCreated({
        id: data.id,
        status: data.status,
        expiresAt: data.expiresAt,
        retrievalUrl: `${origin}/abruf/${data.retrievalToken}#${privateKey}`,
        requestUrl: `${origin}/r/${data.id}`,
        sender: useEmail ? sender.trim() : undefined,
        recipient: useEmail ? recipient.trim() : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unerwarteter Fehler.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (created) return <RequestCreated created={created} />;

  return (
    <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent-hover to-primary opacity-50" />

      <p className="text-sm text-text-secondary mb-5 leading-relaxed">
        Erstelle einen sicheren Link, über den dein Gegenüber dir Zugangsdaten oder eine Datei
        Ende-zu-Ende-verschlüsselt schicken kann. Nur du kannst die Antwort entschlüsseln.
      </p>

      <label htmlFor="req-message" className="block text-sm font-medium text-text-secondary mb-2">
        Was benötigst du? <span className="text-text-muted font-normal">(optional, sieht der Empfänger)</span>
      </label>
      <textarea
        id="req-message"
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, REQUEST_MESSAGE_MAX))}
        disabled={isSubmitting}
        rows={3}
        placeholder="z. B. Bitte schicke mir die Zugangsdaten für den Webserver."
        className={`${inputCls} resize-y`}
      />
      <p className="mt-1 mb-5 text-right text-xs text-text-muted">{message.length}/{REQUEST_MESSAGE_MAX}</p>

      <label htmlFor="req-name" className="block text-sm font-medium text-text-secondary mb-2">
        Dein Name / Firma <span className="text-text-muted font-normal">(optional)</span>
      </label>
      <input
        id="req-name"
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, REQUEST_NAME_MAX))}
        disabled={isSubmitting}
        placeholder="z. B. Max Mustermann, Muster GmbH"
        autoComplete="organization"
        className={`${inputCls} mb-6`}
      />

      <div className="mb-6 pl-1">
        <ExpirySelector selectedTTL={ttl} onChange={setTtl} disabled={isSubmitting} />
      </div>

      {/* E-Mail-Versand */}
      <div className="mb-6 rounded-xl border border-border bg-bg-secondary/60 p-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="useEmail"
            checked={useEmail}
            onChange={(e) => toggleEmail(e.target.checked)}
            disabled={isSubmitting}
            className="w-5 h-5 accent-accent cursor-pointer"
          />
          <label htmlFor="useEmail" className="text-sm font-medium cursor-pointer select-none">
            Anfrage direkt per E-Mail an den Empfänger senden
          </label>
        </div>

        {useEmail && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div>
                <label htmlFor="req-sender" className="block text-xs font-medium text-text-secondary mb-1.5">Deine E-Mail-Adresse</label>
                <input id="req-sender" type="email" required value={sender} onChange={(e) => setSender(e.target.value)}
                  disabled={isSubmitting} autoComplete="email" placeholder="du@firma.de" className={inputCls} />
              </div>
              <div>
                <label htmlFor="req-recipient" className="block text-xs font-medium text-text-secondary mb-1.5">E-Mail des Empfängers</label>
                <input id="req-recipient" type="email" required value={recipient} onChange={(e) => setRecipient(e.target.value)}
                  disabled={isSubmitting} autoComplete="off" placeholder="kunde@beispiel.de" className={inputCls} />
              </div>
            </div>
            <p className="mt-3 text-xs text-text-muted leading-relaxed">
              Zum Schutz vor Missbrauch bekommst du zuerst einen <strong className="text-text-secondary">6-stelligen Code</strong> an
              deine Adresse. Erst nach der Bestätigung geht die Einladung an den Empfänger, mit deiner bestätigten Adresse als Absender.
            </p>
            {linkInText && (
              <p className="mt-2 text-xs text-warning">
                Links, Domains und E-Mail-Adressen sind in Name und Nachricht nicht erlaubt, wenn per E-Mail versendet wird (Phishing-Schutz).
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* Honeypot: für Menschen unsichtbar */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="req-website">Website</label>
        <input id="req-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-accent hover:bg-accent-hover text-bg-primary font-bold text-lg py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {isSubmitting
          ? (useEmail && pow.status === "solving" ? "Sicherheitsprüfung läuft…" : "Wird erstellt…")
          : useEmail ? "Anfrage erstellen & Code anfordern" : "Anfrage-Link erstellen"}
      </button>
      <p className="mt-4 text-center text-xs text-text-muted">
        {useEmail
          ? pow.status === "solving" ? "Unsichtbare Sicherheitsprüfung läuft im Hintergrund (kein Captcha, keine Cookies)…"
            : pow.status === "ready" ? "✓ Sicherheitsprüfung abgeschlossen"
            : pow.status === "error" ? "Sicherheitsprüfung wird beim Absenden erneut versucht."
            : ""
          : "Der Schlüssel zum Entschlüsseln entsteht in deinem Browser und verlässt ihn nie."}
      </p>
    </form>
  );
}

function RequestCreated({ created }: { created: Created }) {
  const [status, setStatus] = useState(created.status);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ invited: boolean; reason?: string } | null>(null);

  const token = created.retrievalUrl.split("/abruf/")[1].split("#")[0];

  // Falls der Bestätigungslink aus der Mail in einem anderen Tab geklickt wird
  useEffect(() => {
    if (status !== "PENDING_VERIFICATION") return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/requests/retrieve/${token}`, { cache: "no-store" }).catch(() => null);
      if (!res?.ok) return;
      const d = await res.json();
      if (d.status !== "PENDING_VERIFICATION") {
        setStatus(d.status);
        setInvite({ invited: d.invited, reason: d.invited ? undefined : "Die Einladung konnte nicht versendet werden." });
      }
    }, 8000);
    return () => clearInterval(t);
  }, [status, token]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch(`/api/requests/${created.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Bestätigung fehlgeschlagen.");
      setStatus("OPEN");
      setInvite({ invited: d.invited ?? true, reason: d.reason });
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Bestätigung fehlgeschlagen.");
    } finally {
      setVerifying(false);
    }
  };

  const exp = new Date(created.expiresAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-bg-card border border-border-focus/30 shadow-lg space-y-6">
      <div className="flex items-center gap-2 text-success">
        <span className="text-xl" aria-hidden="true">✓</span>
        <span className="font-semibold text-lg">Anfrage erstellt</span>
        <span className="ml-auto text-xs text-text-muted">gültig bis {exp} Uhr</span>
      </div>

      {/* 1. Abruf-Link */}
      <section className="rounded-xl border border-warning/30 bg-warning/5 p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">1. Dein Abruf-Link (nur für dich)</p>
        <p className="text-xs text-text-secondary mb-3 leading-relaxed">
          Nur mit diesem Link kannst du die Antwort entschlüsseln. Er enthält deinen privaten Schlüssel,
          wird <strong>nicht erneut angezeigt</strong> und <strong>nicht per E-Mail verschickt</strong>. Speichere ihn jetzt (z. B. als Lesezeichen).
        </p>
        <CopyField value={created.retrievalUrl} tone="warning" />
      </section>

      {/* 2a. Ohne E-Mail: Link selbst teilen */}
      {!created.sender && (
        <section>
          <p className="text-sm font-semibold text-text-primary mb-1">2. Anfrage-Link an dein Gegenüber schicken</p>
          <p className="text-xs text-text-secondary mb-3">Über diesen Link kann dein Gegenüber die Daten verschlüsselt an dich übermitteln.</p>
          <CopyField value={created.requestUrl} />
        </section>
      )}

      {/* 2b. Mit E-Mail: Code bestätigen */}
      {created.sender && status === "PENDING_VERIFICATION" && (
        <section>
          <p className="text-sm font-semibold text-text-primary mb-1">2. E-Mail-Adresse bestätigen</p>
          <p className="text-xs text-text-secondary mb-3 leading-relaxed">
            Wir haben einen 6-stelligen Code an <strong className="text-text-primary">{created.sender}</strong> geschickt.
            Gib ihn hier ein oder klicke auf den Link in der E-Mail. Danach erhält <strong className="text-text-primary">{created.recipient}</strong> die Einladung.
          </p>
          <form onSubmit={verify} className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              aria-label="Bestätigungscode"
              className={`${inputCls} font-mono tracking-[0.4em] text-center text-lg max-w-[12rem]`}
            />
            <button
              type="submit"
              disabled={code.length !== 6 || verifying}
              className="px-5 rounded-xl bg-accent hover:bg-accent-hover text-bg-primary font-semibold disabled:opacity-50"
            >
              {verifying ? "Prüfe…" : "Bestätigen"}
            </button>
          </form>
          {verifyError && <p role="alert" className="mt-2 text-xs text-danger">{verifyError}</p>}
          <p className="mt-2 text-xs text-text-muted">Keine E-Mail bekommen? Schau im Spam-Ordner nach. Der Code ist 30 Minuten gültig.</p>
        </section>
      )}

      {created.sender && status !== "PENDING_VERIFICATION" && (
        <section>
          {invite?.invited !== false ? (
            <p className="text-sm text-success">✓ Einladung an <strong>{created.recipient}</strong> wurde versendet.</p>
          ) : (
            <>
              <p className="text-sm text-warning mb-3">{invite.reason} Du kannst den Link stattdessen selbst schicken:</p>
              <CopyField value={created.requestUrl} />
            </>
          )}
          <p className="mt-2 text-xs text-text-muted">Sobald eine Antwort eingeht, bekommst du eine E-Mail. Öffne dann deinen Abruf-Link.</p>
        </section>
      )}

      <button
        onClick={() => window.location.reload()}
        className="text-sm font-medium px-4 py-2 border border-border rounded-lg hover:bg-bg-secondary transition-colors"
      >
        Neue Anfrage erstellen
      </button>
    </motion.div>
  );
}
