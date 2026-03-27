"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";

interface LinkDisplayProps {
  url: string;
  expiresAt: string;
}

export function LinkDisplay({ url, expiresAt }: LinkDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    if (showQr && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, url, {
        width: 220,
        margin: 2,
        color: {
          dark: "#f1f5f9",  // text-primary
          light: "#1a2035", // bg-card
        },
      });
    }
  }, [showQr, url]);

  const expirationDate = new Date(expiresAt);
  const formattedTime = expirationDate.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const formattedDate = expirationDate.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  const isToday = expirationDate.toDateString() === new Date().toDateString();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="p-6 rounded-2xl bg-bg-card border border-border-focus/30 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-5 text-success">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold text-lg">Dein Geheimnis ist verschlüsselt.</span>
      </div>

      {/* URL + Copy */}
      <div className="relative group mb-6">
        <div className="flex bg-bg-secondary border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition-all">
          <input
            type="text"
            readOnly
            value={url}
            className="w-full bg-transparent px-4 py-3 text-text-primary text-sm font-mono outline-none selection:bg-accent/30 truncate"
            onClick={(e) => e.currentTarget.select()}
          />
          <button
            onClick={handleCopy}
            className="flex items-center justify-center bg-accent text-bg-primary font-medium px-5 transition-colors hover:bg-accent-hover active:scale-95 flex-shrink-0"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1 whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Kopiert
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1 whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Kopieren
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Meta-Info */}
      <div className="space-y-2 text-sm text-text-secondary mb-6">
        <div className="flex items-center gap-2">
          <span>⏱</span>
          <span>
            Verfällt {isToday ? "heute" : `am ${formattedDate}`} um{" "}
            <strong className="text-text-primary">{formattedTime} Uhr</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔥</span>
          <span>Wird nach dem ersten Lesen sofort <strong>unwiderruflich gelöscht</strong>.</span>
        </div>
      </div>

      {/* QR Code Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setShowQr((v) => !v)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          {showQr ? "QR-Code ausblenden" : "Als QR-Code anzeigen"}
        </button>

        <AnimatePresence>
          {showQr && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-col items-center gap-3 p-4 bg-bg-secondary border border-border rounded-xl">
                <canvas ref={qrCanvasRef} className="rounded-lg" />
                <p className="text-xs text-text-muted text-center max-w-xs">
                  Scanne den QR-Code mit deinem Smartphone, um den Link direkt zu öffnen.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-xs text-danger font-medium flex-1">
          ⚠️ Speichere diesen Link JETZT — er wird nicht erneut angezeigt.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-medium px-4 py-2 border border-border rounded-lg hover:bg-bg-secondary hover:text-text-primary transition-colors whitespace-nowrap"
        >
          Neues Geheimnis erstellen
        </button>
      </div>
    </motion.div>
  );
}
