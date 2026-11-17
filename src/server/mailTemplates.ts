import type { Mail } from "./mailer";
import { siteUrl } from "./security";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const fmtDate = (d: Date) =>
  d.toLocaleString("de-DE", {
    timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) + " Uhr";

/** Sichtbare Domain ohne Protokoll, z. B. "unser-geheimnis.de" */
const domain = () => siteUrl().replace(/^https?:\/\//, "");

const DOMAIN_CHECK_TEXT = () =>
  `Sicherheitshinweis: Überprüfen Sie die Domain! Der Link muss mit ${siteUrl()}/ beginnen ` +
  `und in der Adresszeile Ihres Browsers muss exakt „${domain()}“ stehen. ` +
  `Wir fragen niemals per E-Mail nach Passwörtern — Daten werden ausschließlich verschlüsselt auf der Website eingegeben.`;

function layout(opts: { title: string; bodyHtml: string; footerHtml: string }) {
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
<tr><td style="padding:20px 28px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:16px;color:#0a0e1a;">
🔒 ${esc(domain())}</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6;">${opts.bodyHtml}</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.5;color:#64748b;">${opts.footerHtml}</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0;"><a href="${esc(href)}" style="display:inline-block;background:#06d6a0;color:#0a0e1a;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:8px;">${esc(label)}</a></p>
<p style="font-size:12px;color:#64748b;word-break:break-all;">Oder diesen Link kopieren: ${esc(href)}</p>`;

const domainBox = () =>
  `<div style="margin:20px 0;padding:14px 16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:13px;color:#7c2d12;">
<strong>Überprüfen Sie die Domain „${esc(domain())}“!</strong><br>
Der Link muss mit <strong>${esc(siteUrl())}/</strong> beginnen und in der Adresszeile Ihres Browsers muss exakt
„${esc(domain())}“ stehen. Wir fragen niemals per E-Mail nach Passwörtern — Daten werden ausschließlich
verschlüsselt auf der Website eingegeben.</div>`;

const imprint = () =>
  `Automatisch versendet von ${esc(domain())} · <a href="${esc(siteUrl())}/impressum" style="color:#64748b;">Impressum</a> · <a href="${esc(siteUrl())}/datenschutz" style="color:#64748b;">Datenschutz</a>`;

// ── 1. Bestätigung an den Anfragenden ────────────────────────────────

export function verificationMail(p: {
  to: string; recipient: string; code: string; verifyUrl: string; validMinutes: number; optOutUrl: string;
}): Mail {
  const codeSpaced = `${p.code.slice(0, 3)} ${p.code.slice(3)}`;
  const subject = "Bitte bestätigen Sie Ihre Datenanfrage";
  const text = `Guten Tag,

Sie haben auf ${domain()} eine Datenanfrage an ${p.recipient} erstellt.
Bevor wir die Einladung versenden, bestätigen Sie bitte, dass diese E-Mail-Adresse Ihnen gehört.

Ihr Bestätigungscode: ${codeSpaced}

Oder bestätigen Sie über diesen Link:
${p.verifyUrl}

Code und Link sind ${p.validMinutes} Minuten gültig.

${DOMAIN_CHECK_TEXT()}

—
Sie haben diese Anfrage nicht erstellt? Dann ignorieren Sie diese E-Mail. Ohne Bestätigung wird keine Einladung versendet und die Anfrage wird automatisch gelöscht.

Keine E-Mails mehr von ${domain()} an diese Adresse:
${p.optOutUrl}
`;
  const html = layout({
    title: subject,
    bodyHtml: `<p>Guten Tag,</p>
<p>Sie haben auf ${esc(domain())} eine Datenanfrage an <strong>${esc(p.recipient)}</strong> erstellt.
Bevor wir die Einladung versenden, bestätigen Sie bitte, dass diese E-Mail-Adresse Ihnen gehört.</p>
<p style="margin:24px 0 8px;font-size:13px;color:#64748b;">Ihr Bestätigungscode</p>
<p style="margin:0 0 8px;font-size:32px;font-weight:700;letter-spacing:6px;font-family:Menlo,Consolas,monospace;">${esc(codeSpaced)}</p>
<p style="margin:0 0 8px;font-size:13px;color:#64748b;">Gültig für ${p.validMinutes} Minuten.</p>
${button(p.verifyUrl, "Anfrage bestätigen")}
${domainBox()}`,
    footerHtml: `<p style="margin:0 0 8px;"><strong>Sie haben diese Anfrage nicht erstellt?</strong> Dann ignorieren Sie diese E-Mail.
Ohne Bestätigung wird keine Einladung versendet und die Anfrage wird automatisch gelöscht.</p>
<p style="margin:0 0 8px;"><a href="${esc(p.optOutUrl)}" style="color:#64748b;">Keine E-Mails mehr von ${esc(domain())} an diese Adresse</a></p>${imprint()}`,
  });
  return { to: p.to, subject, text, html, headers: { "List-Unsubscribe": `<${p.optOutUrl}>` } };
}

// ── 2. Einladung an den Empfänger ────────────────────────────────────

export function invitationMail(p: {
  to: string; requesterEmail: string; requesterName?: string | null; message?: string | null;
  requestUrl: string; expiresAt: Date; optOutUrl: string;
}): Mail {
  const who = p.requesterName ? `${p.requesterName} (${p.requesterEmail})` : p.requesterEmail;
  const subject = `Datenanfrage von ${p.requesterName || p.requesterEmail} über ${domain()}`;
  const text = `Guten Tag,

${who} bittet Sie, vertrauliche Daten (z. B. Zugangsdaten oder eine Datei) sicher und Ende-zu-Ende-verschlüsselt über ${domain()} zu übermitteln.
Die Absenderadresse wurde von uns per Bestätigungscode verifiziert.
${p.message ? `\nNachricht des Absenders:\n„${p.message}“\n` : ""}
Daten sicher übermitteln:
${p.requestUrl}

Die Anfrage ist gültig bis ${fmtDate(p.expiresAt)}.

${DOMAIN_CHECK_TEXT()}

—
Wenn Sie sich nicht sicher sind, wieso diese Daten angefordert werden oder von wem, ignorieren Sie diese E-Mail bitte. Es passiert nichts — die Anfrage verfällt automatisch. Im Zweifel fragen Sie beim Absender über einen Ihnen bekannten Kontaktweg nach (nicht per Antwort auf diese E-Mail).

Keine weiteren Datenanfragen an diese Adresse erhalten:
${p.optOutUrl}
`;
  const html = layout({
    title: subject,
    bodyHtml: `<p>Guten Tag,</p>
<p><strong>${esc(who)}</strong> bittet Sie, vertrauliche Daten (z. B. Zugangsdaten oder eine Datei) sicher und
Ende-zu-Ende-verschlüsselt über ${esc(domain())} zu übermitteln.</p>
<p style="font-size:13px;color:#047857;">✓ Die Absenderadresse wurde von uns per Bestätigungscode verifiziert.</p>
${p.message ? `<div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-left:3px solid #06d6a0;border-radius:4px;">
<p style="margin:0 0 4px;font-size:12px;color:#64748b;">Nachricht des Absenders</p>
<p style="margin:0;white-space:pre-wrap;">${esc(p.message)}</p></div>` : ""}
${button(p.requestUrl, "Daten sicher übermitteln")}
<p style="font-size:13px;color:#475569;">Die Anfrage ist gültig bis ${esc(fmtDate(p.expiresAt))}.</p>
${domainBox()}`,
    footerHtml: `<p style="margin:0 0 8px;font-size:13px;color:#334155;"><strong>Wenn Sie sich nicht sicher sind, wieso diese Daten angefordert werden oder von wem,
ignorieren Sie diese E-Mail bitte.</strong> Es passiert nichts — die Anfrage verfällt automatisch. Im Zweifel fragen Sie beim
Absender über einen Ihnen bekannten Kontaktweg nach (nicht per Antwort auf diese E-Mail).</p>
<p style="margin:0 0 8px;"><a href="${esc(p.optOutUrl)}" style="color:#64748b;">Keine weiteren Datenanfragen an diese Adresse erhalten</a></p>${imprint()}`,
  });
  return {
    to: p.to, subject, text, html,
    replyTo: p.requesterEmail,
    headers: { "List-Unsubscribe": `<${p.optOutUrl}>` },
  };
}

// ── 3. Benachrichtigung: Antwort eingegangen ─────────────────────────

export function answeredMail(p: { to: string; recipient: string | null; expiresAt: Date }): Mail {
  const subject = "Ihre Datenanfrage wurde beantwortet";
  const text = `Guten Tag,

${p.recipient ? `${p.recipient} hat` : "Ihr Gegenüber hat"} auf Ihre Datenanfrage geantwortet.

Öffnen Sie Ihren gespeicherten Abruf-Link, um die Daten zu entschlüsseln. Aus Sicherheitsgründen ist er nicht in dieser E-Mail enthalten — nur Sie besitzen den Schlüssel.
Die Antwort wird nach dem ersten Abruf gelöscht, spätestens am ${fmtDate(p.expiresAt)}.

${DOMAIN_CHECK_TEXT()}
`;
  const html = layout({
    title: subject,
    bodyHtml: `<p>Guten Tag,</p>
<p>${p.recipient ? `<strong>${esc(p.recipient)}</strong> hat` : "Ihr Gegenüber hat"} auf Ihre Datenanfrage geantwortet.</p>
<p>Öffnen Sie Ihren <strong>gespeicherten Abruf-Link</strong>, um die Daten zu entschlüsseln. Aus Sicherheitsgründen ist er
nicht in dieser E-Mail enthalten — nur Sie besitzen den Schlüssel.</p>
<p style="font-size:13px;color:#475569;">Die Antwort wird nach dem ersten Abruf gelöscht, spätestens am ${esc(fmtDate(p.expiresAt))}.</p>
${domainBox()}`,
    footerHtml: imprint(),
  });
  return { to: p.to, subject, text, html };
}
