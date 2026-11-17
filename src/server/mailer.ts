import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP-Versand. Konfiguration über .env:
 *   SMTP_HOST, SMTP_PORT (587), SMTP_SECURE ("true" bei Port 465),
 *   SMTP_USER, SMTP_PASS, MAIL_FROM ("unser-geheimnis.de <noreply@unser-geheimnis.de>")
 * Ohne SMTP_HOST werden Mails in der Entwicklung nur ins Log geschrieben;
 * in Produktion ist der E-Mail-Versand dann deaktiviert.
 */

let transporter: Transporter | null = null;

export function mailEnabled(): boolean {
  return !!process.env.SMTP_HOST || process.env.NODE_ENV !== "production";
}

function getTransporter(): Transporter {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT) || 587;
    // Lokales Relay (z. B. Postfix auf demselben Server) braucht kein TLS
    const local = ["127.0.0.1", "localhost", "::1"].includes(process.env.SMTP_HOST);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      requireTLS: port !== 465 && !local,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
      // Keine Datei-/URL-Inhalte in Mails zulassen
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  } else {
    transporter = nodemailer.createTransport({ streamTransport: true, buffer: true });
  }
  return transporter;
}

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export async function sendMail(mail: Mail): Promise<void> {
  const from = process.env.MAIL_FROM || "unser-geheimnis.de <noreply@unser-geheimnis.de>";
  const info = await getTransporter().sendMail({
    from,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    replyTo: mail.replyTo,
    headers: { "Auto-Submitted": "auto-generated", ...mail.headers },
  });
  if (!process.env.SMTP_HOST) {
    console.log(`[mail:dev] An ${mail.to}: ${mail.subject}\n${mail.text}\n`);
  } else {
    console.log(`[mail] versendet (${info.messageId})`);
  }
}
