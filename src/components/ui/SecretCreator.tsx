"use client";

import { useState, useRef } from "react";
import { ExpirySelector } from "./ExpirySelector";
import { LinkDisplay } from "./LinkDisplay";
import {
  encryptSecret,
  exportKeyToBase64url,
  arrayBufferToBase64,
  encryptKeyWithPassword,
  buildPasswordFragment,
} from "@/lib/crypto";
import { ValidTTL, DEFAULT_BURN_AFTER_READ } from "@/lib/constants";
import { createSecretSchema } from "@/lib/validation";

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16 MB

export function SecretCreator() {
  const [activeTab, setActiveTab] = useState<"TEXT" | "FILE">("TEXT");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [ttl, setTtl] = useState<ValidTTL>(24);
  const [burnAfterRead, setBurnAfterRead] = useState(DEFAULT_BURN_AFTER_READ);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; expiresAt: string; burnAfterRead: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Passwortschutz
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setError(null);
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("Die Datei ist zu groß (maximal 16 MB erlaubt).");
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "TEXT" && !text.trim()) {
      setError("Bitte gib ein Geheimnis ein.");
      return;
    }
    if (activeTab === "FILE" && !file) {
      setError("Bitte wähle eine Datei aus.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      let keyData;
      let res;
      
      if (activeTab === "TEXT") {
        const { encryptedData, iv, key } = await encryptSecret(text);
        keyData = key;
        
        const payload = {
          encryptedData: arrayBufferToBase64(encryptedData),
          iv: arrayBufferToBase64(iv),
          type: "TEXT" as const,
          expiresIn: ttl,
          burnAfterRead,
        };
        createSecretSchema.parse(payload);

        res = await fetch("/api/secrets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // FILE Upload Logik
        const arrayBuffer = await file!.arrayBuffer();
        const { encryptedData, iv, key } = await encryptSecret(arrayBuffer);
        keyData = key;
        
        const formData = new FormData();
        formData.append("type", "FILE");
        formData.append("expiresIn", ttl.toString());
        formData.append("burnAfterRead", String(burnAfterRead));
        formData.append("iv", arrayBufferToBase64(iv));
        formData.append("fileName", file!.name);
        formData.append("mimeType", file!.type || "application/octet-stream");
        // Verschlüsselte Blob anhängen
        formData.append("file", new Blob([encryptedData]));

        res = await fetch("/api/secrets", {
          method: "POST",
          body: formData,
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Beim Erstellen ist ein Fehler aufgetreten.");
      }

      const { id, expiresAt } = await res.json();

      let fragment: string;
      if (usePassword && password) {
        // Passwort-gesichertes Fragment: AES-Key mit PBKDF2 verschlüsseln
        const { salt, iv: iv2, encryptedKey } = await encryptKeyWithPassword(keyData, password);
        fragment = buildPasswordFragment(salt, iv2, encryptedKey);
      } else {
        // Kein Passwort: Rohschlüssel im Fragment
        fragment = await exportKeyToBase64url(keyData);
      }

      const url = `${window.location.origin}/s/${id}#${fragment}`;

      setResult({ url, expiresAt, burnAfterRead });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Es ist ein unerwarteter Fehler aufgetreten.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return <LinkDisplay url={result.url} expiresAt={result.expiresAt} burnAfterRead={result.burnAfterRead} />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent-hover to-primary opacity-50" />
        
        <div className="mb-6 flex space-x-2 border-b border-border">
          <button 
            type="button" 
            onClick={() => setActiveTab("TEXT")}
            className={`px-4 py-3 font-medium transition-colors ${activeTab === "TEXT" ? "border-b-2 border-accent text-accent" : "text-text-secondary hover:text-text-primary"}`}
          >
            📝 Text
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab("FILE")}
            className={`px-4 py-3 font-medium transition-colors ${activeTab === "FILE" ? "border-b-2 border-accent text-accent" : "text-text-secondary hover:text-text-primary"}`}
          >
            📎 Datei
          </button>
        </div>

        <div className="mb-6">
          {activeTab === "TEXT" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isSubmitting}
              placeholder="Passwort, API-Key, Zugangsdaten oder vertrauliche Nachricht..."
              className="w-full h-40 p-4 bg-bg-secondary border border-border rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all font-mono text-sm leading-relaxed text-text-primary resize-y"
            />
          ) : (
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all ${isDragging ? "border-accent bg-accent/5" : "border-border hover:border-text-muted bg-bg-secondary"}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])}
              />
              {file ? (
                <div className="text-center px-4">
                  <span className="text-accent text-3xl mb-2 block">📄</span>
                  <p className="font-medium text-text-primary truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-text-secondary mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="text-center px-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-text-primary">Datei hierher ziehen oder klicken</p>
                  <p className="text-xs text-text-secondary mt-1">Maximal 16 MB</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-8 pl-1">
          <ExpirySelector selectedTTL={ttl} onChange={setTtl} disabled={isSubmitting} />
        </div>

        <div className="mb-4 pl-1 flex items-center gap-3">
          <input
            type="checkbox"
            id="burn"
            checked={burnAfterRead}
            onChange={(e) => setBurnAfterRead(e.target.checked)}
            disabled={isSubmitting}
            className="w-5 h-5 accent-accent cursor-pointer"
          />
          <label htmlFor="burn" className="text-sm font-medium cursor-pointer select-none">
            Nach dem ersten Lesen sofort löschen
          </label>
        </div>

        {/* Passwortschutz */}
        <div className="mb-6 pl-1">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="usePassword"
              checked={usePassword}
              onChange={(e) => {
                setUsePassword(e.target.checked);
                if (!e.target.checked) setPassword("");
              }}
              disabled={isSubmitting}
              className="w-5 h-5 accent-accent cursor-pointer"
            />
            <label htmlFor="usePassword" className="text-sm font-medium cursor-pointer select-none">
              Extra Passwortschutz
            </label>
            <span className="text-xs text-text-muted bg-bg-secondary border border-border px-2 py-0.5 rounded-full">optional</span>
          </div>

          {usePassword && (
            <div className="mt-3 flex items-center gap-2 bg-bg-secondary border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition-all">
              <span className="pl-4 text-text-muted flex-shrink-0">🔑</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                placeholder="Passwort für den Empfänger…"
                className="flex-1 bg-transparent px-3 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="px-4 text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
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
          )}

          {usePassword && password && (
            <p className="mt-2 text-xs text-text-muted pl-1">
              ⚠️ Das Passwort muss dem Empfänger <strong>separat</strong> mitgeteilt werden — nicht im selben Kanal wie der Link.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full relative overflow-hidden group bg-accent hover:bg-accent-hover text-bg-primary font-bold text-lg py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verschlüsselt...
            </span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Geheimnis verschlüsseln & Link erstellen
            </>
          )}
        </button>
        <p className="mt-4 text-center text-xs text-text-muted flex items-center justify-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Zero-Knowledge Verschlüsselung lokal im Browser
        </p>
      </form>
    </div>
  );
}
