"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  decryptSecret,
  decryptKeyWithPassword,
  parseFragment,
  base64ToArrayBuffer,
} from "@/lib/crypto";

// Schwebende Partikel für die Lade-Animation
function Particles() {
  const particles = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-accent"
          style={{
            left: `${15 + (i * 7) % 70}%`,
            top: `${10 + (i * 11) % 80}%`,
          }}
          animate={{
            x: [0, (i % 2 === 0 ? 1 : -1) * (8 + (i % 4) * 5)],
            y: [0, -(10 + (i % 5) * 6)],
            opacity: [0, 0.7, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 1.4 + (i % 5) * 0.3,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// Schloss-Icon das sich "entsperrt"
function LockIcon({ phase }: { phase: "locked" | "unlocking" | "unlocked" }) {
  return (
    <div className="relative w-24 h-24 mx-auto">
      {/* Glow-Halo */}
      <motion.div
        className="absolute inset-0 rounded-full bg-accent/20"
        animate={
          phase === "unlocked"
            ? { scale: [1, 1.6, 1], opacity: [0.2, 0, 0] }
            : phase === "unlocking"
            ? { scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }
            : { scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }
        }
        transition={{ duration: phase === "unlocked" ? 0.6 : 1.8, repeat: phase === "unlocked" ? 0 : Infinity }}
      />

      {/* Icon-Hintergrund */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 flex items-center justify-center"
        animate={
          phase === "unlocked"
            ? { borderColor: "rgba(6, 214, 160, 0.8)", backgroundColor: "rgba(6, 214, 160, 0.15)" }
            : phase === "unlocking"
            ? { borderColor: "rgba(6, 214, 160, 0.5)", backgroundColor: "rgba(6, 214, 160, 0.08)" }
            : { borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(26, 32, 53, 1)" }
        }
        transition={{ duration: 0.4 }}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          animate={{
            color: phase === "unlocked" ? "#06d6a0" : phase === "unlocking" ? "#06d6a0" : "#94a3b8",
          }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {phase === "unlocked" ? (
              // Entsperrtes Schloss
              <motion.path
                key="unlocked"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                transition={{ duration: 0.4 }}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 11V7a4 4 0 018 0m0 0v1M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z"
              />
            ) : (
              // Gesperrtes Schloss
              <motion.path
                key="locked"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            )}
          </AnimatePresence>
        </motion.svg>
      </motion.div>
    </div>
  );
}

function useCountdown(expiresAt: string | null) {
  const calc = useCallback(() => {
    if (!expiresAt) return null;
    const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return { h, m, s, expired: diff === 0 };
  }, [expiresAt]);

  const [remaining, setRemaining] = useState(calc);
  useEffect(() => {
    if (!expiresAt) return;
    setRemaining(calc());
    const id = setInterval(() => setRemaining(calc()), 1_000);
    return () => clearInterval(id);
  }, [expiresAt, calc]);
  return remaining;
}

export function SecretRevealer({ id }: { id: string }) {
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{ url: string; name: string; mime: string } | null>(null);
  const [burnAfterRead, setBurnAfterRead] = useState<boolean | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fragment-Info
  type FragmentInfo =
    | { type: "key"; rawKey: string }
    | { type: "password"; salt: Uint8Array; iv: Uint8Array; encryptedKey: ArrayBuffer }
    | null;
  const [fragmentInfo, setFragmentInfo] = useState<FragmentInfo>(null);
  const isPasswordProtected = fragmentInfo?.type === "password";

  // Passwort-Eingabe
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);

  const countdown = useCountdown(burnAfterRead === false ? expiresAt : null);

  // Animation-Phasen
  type Phase = "initial" | "loading" | "unlocking" | "revealing" | "done";
  const [phase, setPhase] = useState<Phase>("initial");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      setError("Kein Entschlüsselungsschlüssel im Link gefunden. Der Link ist ungültig oder unvollständig kopiert worden.");
    } else {
      setFragmentInfo(parseFragment(hash));
    }
    return () => {
      if (fileData?.url) URL.revokeObjectURL(fileData.url);
    };
  }, [fileData?.url]);

  const handleDecrypt = async () => {
    if (!fragmentInfo) return;
    if (isPasswordProtected && !password) return;

    setPhase("loading");
    setError(null);
    setWrongPassword(false);

    try {
      const res = await fetch(`/api/secrets/${id}`);
      if (!res.ok) {
        throw new Error("Geheimnis nicht gefunden, bereits abgelaufen oder bereits von jemand anderem abgerufen.");
      }

      const payload = await res.json();
      setBurnAfterRead(payload.burnAfterRead ?? true);
      setExpiresAt(payload.expiresAt ?? null);
      const encryptedBuffer = base64ToArrayBuffer(payload.encryptedData);
      const ivBuffer = new Uint8Array(base64ToArrayBuffer(payload.iv));

      // Schlüssel ermitteln — direkt oder via Passwort
      let decryptedBuffer: ArrayBuffer;
      if (fragmentInfo.type === "password") {
        let contentKey;
        try {
          contentKey = await decryptKeyWithPassword(
            fragmentInfo.encryptedKey,
            fragmentInfo.iv,
            fragmentInfo.salt,
            password
          );
        } catch {
          // AES-GCM schlägt bei falschem Passwort fehl
          setWrongPassword(true);
          setPhase("initial");
          return;
        }
        decryptedBuffer = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: ivBuffer },
          contentKey,
          encryptedBuffer
        );
      } else {
        decryptedBuffer = await decryptSecret(encryptedBuffer, ivBuffer, fragmentInfo.rawKey);
      }

      // Phase "unlocking" — kurze dramatische Pause
      setPhase("unlocking");
      await new Promise((r) => setTimeout(r, 700));

      if (payload.type === "FILE") {
        const blob = new Blob([decryptedBuffer], { type: payload.mimeType || "application/octet-stream" });
        const objectUrl = URL.createObjectURL(blob);
        setFileData({ url: objectUrl, name: payload.fileName || "unknown_secret.bin", mime: payload.mimeType || "application/octet-stream" });
      } else {
        const text = new TextDecoder().decode(decryptedBuffer);
        setDecryptedText(text);
      }

      setPhase("revealing");
      await new Promise((r) => setTimeout(r, 1000));
      setPhase("done");
    } catch (err: unknown) {
      console.error("Decrypt error", err);
      const msg = err instanceof Error ? err.message : "Fehler bei der Entschlüsselung.";
      setError(msg);
      setPhase("initial");
    }
  };

  const handleCopy = () => {
    if (decryptedText) {
      navigator.clipboard.writeText(decryptedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 max-w-lg mx-auto text-center border border-danger/30 bg-danger/10 rounded-2xl"
      >
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-danger mb-3">Dieses Geheimnis existiert nicht (mehr)</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-6">{error}</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-6 py-2 bg-bg-secondary hover:bg-bg-card border border-border rounded-lg text-sm transition-colors"
        >
          Zurück zur Startseite
        </button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">

        {/* ── Phase 1: Initiale Ansicht ── */}
        {phase === "initial" && (
          <motion.div
            key="initial"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-bg-card border border-border rounded-2xl p-8 shadow-xl text-center"
          >
            <LockIcon phase="locked" />

            <h1 className="mt-6 text-3xl font-serif text-text-primary mb-3">
              Ein Geheimnis wartet auf dich.
            </h1>
            <p className="text-text-secondary mb-6 leading-relaxed max-w-md mx-auto text-sm">
              Jemand hat über einen sicheren, verschlüsselten Link vertrauliche Daten mit dir geteilt.
              Sobald du es entschlüsselst, wird es bei uns <strong>unwiderruflich gelöscht</strong>.
            </p>

            {/* Passwort-Eingabe (nur wenn nötig) */}
            {isPasswordProtected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 text-left max-w-sm mx-auto"
              >
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  🔑 Dieses Geheimnis ist passwortgeschützt
                </label>
                <div className={`flex items-center bg-bg-secondary border rounded-xl overflow-hidden transition-colors ${wrongPassword ? "border-danger" : "border-border focus-within:border-accent"}`}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setWrongPassword(false); }}
                    onKeyDown={(e) => e.key === "Enter" && password && handleDecrypt()}
                    placeholder="Passwort eingeben…"
                    className="flex-1 bg-transparent px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted"
                    autoFocus
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="px-4 text-text-muted hover:text-text-primary transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {wrongPassword && (
                  <p className="mt-2 text-xs text-danger font-medium">
                    ❌ Falsches Passwort. Bitte erneut versuchen.
                  </p>
                )}
              </motion.div>
            )}

            <button
              onClick={handleDecrypt}
              disabled={!fragmentInfo || (isPasswordProtected && !password)}
              className="w-full sm:w-auto px-10 py-4 bg-accent hover:bg-accent-hover text-bg-primary font-bold text-lg rounded-xl transition-transform active:scale-95 disabled:opacity-50 shadow-lg"
            >
              🔓 Geheimnis entschlüsseln & anzeigen
            </button>

            {/* burnAfterRead ist beim Öffnen noch nicht bekannt — Fragment-Typ gibt Hinweis */}
            <div className="mt-8 pt-6 border-t border-border flex items-center justify-center gap-2 text-xs font-medium text-text-muted">
              🔒 Ende-zu-Ende verschlüsselt · Schlüssel nur in deinem Browser
            </div>
          </motion.div>
        )}

        {/* ── Phase 2: Laden ── */}
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative bg-bg-card border border-border rounded-2xl p-12 shadow-xl text-center overflow-hidden"
          >
            <Particles />
            <LockIcon phase="locked" />
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mt-6 text-accent font-medium"
            >
              Lade verschlüsselte Daten...
            </motion.p>
            <p className="mt-2 text-text-muted text-xs">Zero-Knowledge — der Schlüssel verlässt nie deinen Browser</p>
          </motion.div>
        )}

        {/* ── Phase 3: Entsperrung ── */}
        {phase === "unlocking" && (
          <motion.div
            key="unlocking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-bg-card border border-accent/30 rounded-2xl p-12 shadow-xl text-center overflow-hidden"
          >
            {/* Glow-Hintergrund */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{ boxShadow: ["0 0 0 0 rgba(6,214,160,0)", "0 0 60px 10px rgba(6,214,160,0.12)", "0 0 0 0 rgba(6,214,160,0)"] }}
              transition={{ duration: 0.7 }}
            />
            <Particles />
            <LockIcon phase="unlocking" />
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-accent font-medium"
            >
              Entschlüssele lokal im Browser...
            </motion.p>
            <p className="mt-2 text-text-muted text-xs">AES-256-GCM · kein Netzwerk-Request mit dem Schlüssel</p>
          </motion.div>
        )}

        {/* ── Phase 4 + 5: Inhalt anzeigen ── */}
        {(phase === "revealing" || phase === "done") && (
          <motion.div
            key="revealed"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-accent/10 border-b border-accent/20 flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
              >
                <LockIcon phase="unlocked" />
              </motion.div>
              <div>
                <p className="text-accent font-semibold">Entschlüsselter Inhalt</p>
                <p className="text-text-muted text-xs">Nur in deinem Browser sichtbar — nie auf unserem Server</p>
              </div>
            </div>

            {/* Inhalt */}
            {fileData ? (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring" }}
                  className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 border border-border"
                >
                  <span className="text-2xl">📄</span>
                </motion.div>
                <h3 className="text-text-primary font-medium text-lg mb-1">{fileData.name}</h3>
                <p className="text-text-secondary text-sm mb-6">Erfolgreich lokal entschlüsselt.</p>
                <a
                  href={fileData.url}
                  download={fileData.name}
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-bg-primary font-medium px-6 py-3 rounded-xl transition-transform active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Datei herunterladen
                </a>
              </div>
            ) : (
              <>
                <div className="bg-bg-secondary px-6 py-3 flex items-center justify-between border-b border-border">
                  <span className="font-mono text-xs tracking-widest text-text-muted uppercase">
                    // entschlüsselter inhalt
                  </span>
                  <button
                    onClick={handleCopy}
                    className="text-sm font-medium flex items-center gap-1.5 transition-colors hover:text-accent"
                    style={{ color: copied ? "#06d6a0" : "#94a3b8" }}
                  >
                    {copied ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Kopiert!
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Inhalt kopieren
                      </>
                    )}
                  </button>
                </div>

                <div className="p-6 md:p-8 bg-[#0d1224]">
                  <motion.pre
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="font-mono text-sm sm:text-base text-text-primary whitespace-pre-wrap break-words leading-relaxed selection:bg-accent/30 overflow-x-auto"
                  >
                    {decryptedText}
                  </motion.pre>
                </div>
              </>
            )}

            {/* Status-Hinweis nach dem Entschlüsseln */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: phase === "done" ? 1 : 0,
                height: phase === "done" ? "auto" : 0,
              }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className={`border-t-2 px-6 py-4 flex items-center gap-3 ${
                burnAfterRead
                  ? "bg-danger/10 border-danger"
                  : "bg-warning/10 border-warning"
              }`}
            >
              <span className="text-xl flex-shrink-0">{burnAfterRead ? "🔥" : "⏱"}</span>
              <p className={`font-medium text-sm ${burnAfterRead ? "text-danger" : "text-warning"}`}>
                {burnAfterRead ? (
                  <>
                    Dieses Geheimnis wurde soeben{" "}
                    <strong>unwiderruflich von den Servern gelöscht</strong>.
                    Sichere den Inhalt jetzt lokal.
                  </>
                ) : (
                  <>
                    Dieses Geheimnis ist <strong>weiterhin abrufbar</strong> bis es abläuft.
                    {countdown && !countdown.expired && (
                      <span className="block mt-1 font-mono text-xs opacity-80">
                        Verfällt in{" "}
                        {countdown.h > 0 && `${countdown.h}h `}
                        {(countdown.h > 0 || countdown.m > 0) && `${String(countdown.m).padStart(2, "0")}m `}
                        {String(countdown.s).padStart(2, "0")}s
                      </span>
                    )}
                    {countdown?.expired && (
                      <span className="block mt-1 text-xs opacity-80">Abgelaufen.</span>
                    )}
                  </>
                )}
              </p>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
