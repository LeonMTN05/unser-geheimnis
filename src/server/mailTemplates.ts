import type { Mail } from "./mailer";
import { siteUrl } from "./security";

/*
 * E-Mail-Vorlagen. Bewusst "altmodisch" gebaut, damit sie auch in Outlook
 * (Word-Rendering-Engine) sauber aussehen:
 *  - Layout nur mit Tabellen, feste Breite 600 px, bgcolor-Attribute
 *  - Buttons als VML-Roundrect für Outlook ("bulletproof button")
 *  - keine Divs mit Padding/Radius für tragende Elemente, keine Webfonts
 */

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

const FONT = "'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif";
const MONO = "Consolas,'Courier New',Menlo,monospace";
const C = {
  page: "#eef2f6", card: "#ffffff", ink: "#0f172a", text: "#334155", muted: "#64748b",
  line: "#e2e8f0", brand: "#0a0e1a", accent: "#06d6a0", accentInk: "#0a0e1a",
  soft: "#f8fafc", warnBg: "#fff7ed", warnLine: "#f59e0b", warnInk: "#7c2d12", ok: "#047857",
};

const DOMAIN_CHECK_TEXT = () =>
  `Sicherheitshinweis: Überprüfen Sie die Domain! Der Link muss mit ${siteUrl()}/ beginnen ` +
  `und in der Adresszeile Ihres Browsers muss exakt „${domain()}“ stehen. ` +
  `Wir fragen niemals per E-Mail nach Passwörtern — Daten werden ausschließlich verschlüsselt auf der Website eingegeben.`;

// ── Bausteine ────────────────────────────────────────────────────────

const p = (html: string, style = "") =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:24px;color:${C.text};${style}">${html}</p>`;

const small = (html: string, style = "") =>
  `<p style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};${style}">${html}</p>`;

function button(href: string, label: string) {
  const h = esc(href);
  const l = esc(label);
  const width = Math.max(220, label.length * 10 + 60);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;"><tr><td>
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${h}" style="height:48px;v-text-anchor:middle;width:${width}px;" arcsize="17%" stroke="f" fillcolor="${C.accent}">
<w:anchorlock/><center style="color:${C.accentInk};font-family:'Segoe UI',Arial,sans-serif;font-size:16px;font-weight:bold;">${l}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-- -->
<a href="${h}" target="_blank" style="display:inline-block;background-color:${C.accent};color:${C.accentInk};font-family:${FONT};font-size:16px;font-weight:700;line-height:48px;text-align:center;text-decoration:none;padding:0 28px;border-radius:8px;mso-hide:all;">${l}</a>
<!--<![endif]-->
</td></tr></table>
${small(`Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br><a href="${h}" style="color:${C.muted};word-break:break-all;">${h}</a>`)}`;
}

/** Hervorgehobene Box (Tabelle mit farbigem linken Rand — funktioniert in Outlook). */
function box(inner: string, opts: { bg: string; line: string }) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;">
<tr>
<td width="4" bgcolor="${opts.line}" style="background-color:${opts.line};font-size:0;line-height:0;">&nbsp;</td>
<td bgcolor="${opts.bg}" style="background-color:${opts.bg};padding:14px 18px;">${inner}</td>
</tr></table>`;
}

const domainBox = () =>
  box(
    `<p style="margin:0 0 6px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:${C.warnInk};">Überprüfen Sie die Domain „${esc(domain())}“</p>
<p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:${C.warnInk};">Der Link muss mit <strong>${esc(siteUrl())}/</strong> beginnen und in der Adresszeile Ihres Browsers muss exakt „${esc(domain())}“ stehen. Wir fragen niemals per E-Mail nach Passwörtern — Daten werden ausschließlich verschlüsselt auf der Website eingegeben.</p>`,
    { bg: C.warnBg, line: C.warnLine }
  );

const imprint = () =>
  `<p style="margin:0;font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted};">Automatisch versendet von ${esc(domain())} · <a href="${esc(siteUrl())}/impressum" style="color:${C.muted};">Impressum</a> · <a href="${esc(siteUrl())}/datenschutz" style="color:${C.muted};">Datenschutz</a></p>`;

function layout(opts: { title: string; preheader: string; bodyHtml: string; footerHtml: string }) {
  const [name, tld] = (() => {
    const d = domain();
    const i = d.lastIndexOf(".");
    return i > 0 ? [d.slice(0, i), d.slice(i)] : [d, ""];
  })();
  return `<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(opts.title)}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>table,td,p,a{font-family:'Segoe UI',Arial,sans-serif !important;}</style>
<![endif]-->
<style>
  @media (max-width:620px){ .container{width:100% !important;} .px{padding-left:20px !important;padding-right:20px !important;} }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.page};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};">${esc(opts.preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background-color:${C.page};">
<tr><td align="center" style="padding:32px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

<!-- Kopf -->
<tr><td bgcolor="${C.brand}" class="px" style="background-color:${C.brand};padding:22px 36px;border-radius:12px 12px 0 0;">
<p style="margin:0;font-family:${FONT};font-size:18px;line-height:24px;font-weight:700;color:#ffffff;">&#128274;&nbsp; ${esc(name)}<span style="color:${C.accent};">${esc(tld)}</span></p>
</td></tr>
<tr><td bgcolor="${C.accent}" style="background-color:${C.accent};height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

<!-- Inhalt -->
<tr><td bgcolor="${C.card}" class="px" style="background-color:${C.card};padding:36px 36px 20px;">
${opts.bodyHtml}
</td></tr>

<!-- Fuß -->
<tr><td bgcolor="${C.soft}" class="px" style="background-color:${C.soft};padding:22px 36px 26px;border-top:1px solid ${C.line};border-radius:0 0 12px 12px;">
${opts.footerHtml}
</td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>`;
}

const h1 = (t: string) =>
  `<h1 style="margin:0 0 20px;font-family:${FONT};font-size:22px;line-height:30px;font-weight:700;color:${C.ink};">${esc(t)}</h1>`;

// ── 1. Bestätigung an den Anfragenden ────────────────────────────────

export function verificationMail(p_: {
  to: string; recipient: string; code: string; verifyUrl: string; validMinutes: number; optOutUrl: string;
}): Mail {
  const codeSpaced = `${p_.code.slice(0, 3)} ${p_.code.slice(3)}`;
  const subject = "Bitte bestätigen Sie Ihre Datenanfrage";
  const text = `Guten Tag,

Sie haben auf ${domain()} eine Datenanfrage an ${p_.recipient} erstellt.
Bevor wir die Einladung versenden, bestätigen Sie bitte, dass diese E-Mail-Adresse Ihnen gehört.

Ihr Bestätigungscode: ${codeSpaced}

Oder bestätigen Sie über diesen Link:
${p_.verifyUrl}

Code und Link sind ${p_.validMinutes} Minuten gültig.

${DOMAIN_CHECK_TEXT()}

—
Sie haben diese Anfrage nicht erstellt? Dann ignorieren Sie diese E-Mail. Ohne Bestätigung wird keine Einladung versendet und die Anfrage wird automatisch gelöscht.

Keine E-Mails mehr von ${domain()} an diese Adresse:
${p_.optOutUrl}
`;
  const codeBox = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;">
<tr><td align="center" bgcolor="${C.soft}" style="background-color:${C.soft};border:1px solid ${C.line};border-radius:10px;padding:18px 12px;">
<p style="margin:0 0 6px;font-family:${FONT};font-size:12px;line-height:16px;letter-spacing:1px;text-transform:uppercase;color:${C.muted};">Ihr Bestätigungscode</p>
<p style="margin:0;font-family:${MONO};font-size:34px;line-height:42px;font-weight:700;letter-spacing:8px;color:${C.ink};">${esc(codeSpaced)}</p>
<p style="margin:6px 0 0;font-family:${FONT};font-size:12px;line-height:16px;color:${C.muted};">Gültig für ${p_.validMinutes} Minuten</p>
</td></tr></table>`;
  const html = layout({
    title: subject,
    preheader: `Ihr Code: ${codeSpaced} — gültig für ${p_.validMinutes} Minuten.`,
    bodyHtml: `${h1("Datenanfrage bestätigen")}
${p("Guten Tag,")}
${p(`Sie haben auf ${esc(domain())} eine Datenanfrage an <strong style="color:${C.ink};">${esc(p_.recipient)}</strong> erstellt. Bevor wir die Einladung versenden, bestätigen Sie bitte, dass diese E-Mail-Adresse Ihnen gehört.`)}
${codeBox}
${p("Geben Sie den Code auf der Website ein oder bestätigen Sie direkt:")}
${button(p_.verifyUrl, "Anfrage bestätigen")}
${domainBox()}`,
    footerHtml: `<p style="margin:0 0 10px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.text};"><strong>Sie haben diese Anfrage nicht erstellt?</strong> Dann ignorieren Sie diese E-Mail. Ohne Bestätigung wird keine Einladung versendet und die Anfrage wird automatisch gelöscht.</p>
<p style="margin:0 0 10px;font-family:${FONT};font-size:12px;line-height:18px;"><a href="${esc(p_.optOutUrl)}" style="color:${C.muted};">Keine E-Mails mehr von ${esc(domain())} an diese Adresse</a></p>
${imprint()}`,
  });
  return { to: p_.to, subject, text, html, headers: { "List-Unsubscribe": `<${p_.optOutUrl}>` } };
}

// ── 2. Einladung an den Empfänger ────────────────────────────────────

export function invitationMail(p_: {
  to: string; requesterEmail: string; requesterName?: string | null; message?: string | null;
  requestUrl: string; expiresAt: Date; optOutUrl: string;
}): Mail {
  const who = p_.requesterName ? `${p_.requesterName} (${p_.requesterEmail})` : p_.requesterEmail;
  const subject = `Datenanfrage von ${p_.requesterName || p_.requesterEmail} über ${domain()}`;
  const text = `Guten Tag,

${who} bittet Sie, vertrauliche Daten (z. B. Zugangsdaten oder eine Datei) sicher und Ende-zu-Ende-verschlüsselt über ${domain()} zu übermitteln.
Die Absenderadresse wurde von uns per Bestätigungscode verifiziert.
${p_.message ? `\nNachricht des Absenders:\n„${p_.message}“\n` : ""}
Daten sicher übermitteln:
${p_.requestUrl}

Die Anfrage ist gültig bis ${fmtDate(p_.expiresAt)}.

${DOMAIN_CHECK_TEXT()}

—
Wenn Sie sich nicht sicher sind, wieso diese Daten angefordert werden oder von wem, ignorieren Sie diese E-Mail bitte. Es passiert nichts — die Anfrage verfällt automatisch. Im Zweifel fragen Sie beim Absender über einen Ihnen bekannten Kontaktweg nach (nicht per Antwort auf diese E-Mail).

Keine weiteren Datenanfragen an diese Adresse erhalten:
${p_.optOutUrl}
`;
  const messageBox = p_.message
    ? box(
        `<p style="margin:0 0 4px;font-family:${FONT};font-size:12px;line-height:16px;color:${C.muted};">Nachricht des Absenders</p>
<p style="margin:0;font-family:${FONT};font-size:15px;line-height:22px;color:${C.ink};">${esc(p_.message).replace(/\n/g, "<br>")}</p>`,
        { bg: C.soft, line: C.accent }
      )
    : "";
  const html = layout({
    title: subject,
    preheader: `${p_.requesterName || p_.requesterEmail} bittet Sie, Daten verschlüsselt zu übermitteln.`,
    bodyHtml: `${h1("Sie haben eine Datenanfrage erhalten")}
${p("Guten Tag,")}
${p(`<strong style="color:${C.ink};">${esc(who)}</strong> bittet Sie, vertrauliche Daten (z. B. Zugangsdaten oder eine Datei) sicher und Ende-zu-Ende-verschlüsselt über ${esc(domain())} zu übermitteln.`)}
${p(`&#10003;&nbsp; Die Absenderadresse wurde von uns per Bestätigungscode verifiziert.`, `font-size:13px;line-height:20px;color:${C.ok};`)}
${messageBox}
${button(p_.requestUrl, "Daten sicher übermitteln")}
${p(`Die Anfrage ist gültig bis <strong style="color:${C.ink};">${esc(fmtDate(p_.expiresAt))}</strong>.`, "font-size:14px;")}
${domainBox()}`,
    footerHtml: `<p style="margin:0 0 10px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.text};"><strong>Wenn Sie sich nicht sicher sind, wieso diese Daten angefordert werden oder von wem, ignorieren Sie diese E-Mail bitte.</strong> Es passiert nichts — die Anfrage verfällt automatisch. Im Zweifel fragen Sie beim Absender über einen Ihnen bekannten Kontaktweg nach (nicht per Antwort auf diese E-Mail).</p>
<p style="margin:0 0 10px;font-family:${FONT};font-size:12px;line-height:18px;"><a href="${esc(p_.optOutUrl)}" style="color:${C.muted};">Keine weiteren Datenanfragen an diese Adresse erhalten</a></p>
${imprint()}`,
  });
  return {
    to: p_.to, subject, text, html,
    replyTo: p_.requesterEmail,
    headers: { "List-Unsubscribe": `<${p_.optOutUrl}>` },
  };
}

// ── 3. Benachrichtigung: Antwort eingegangen ─────────────────────────

export function answeredMail(p_: { to: string; recipient: string | null; expiresAt: Date; openUrl: string }): Mail {
  const subject = "Ihre Datenanfrage wurde beantwortet";
  const who = p_.recipient ? `${p_.recipient} hat` : "Ihr Gegenüber hat";
  const text = `Guten Tag,

${who} auf Ihre Datenanfrage geantwortet.

Antwort öffnen:
${p_.openUrl}

Der Link funktioniert in dem Browser, in dem Sie die Anfrage erstellt haben — dort ist Ihr Schlüssel gespeichert. In einem anderen Browser oder Gerät öffnen Sie bitte Ihren gespeicherten Abruf-Link. Aus Sicherheitsgründen ist der Schlüssel nicht in dieser E-Mail enthalten.

Die Antwort wird nach dem ersten Abruf gelöscht, spätestens am ${fmtDate(p_.expiresAt)}.

${DOMAIN_CHECK_TEXT()}
`;
  const html = layout({
    title: subject,
    preheader: `${who} geantwortet. Jetzt sicher öffnen.`,
    bodyHtml: `${h1("Ihre Datenanfrage wurde beantwortet")}
${p("Guten Tag,")}
${p(`${p_.recipient ? `<strong style="color:${C.ink};">${esc(p_.recipient)}</strong> hat` : "Ihr Gegenüber hat"} auf Ihre Datenanfrage geantwortet. Die Daten liegen verschlüsselt bereit — nur Sie können sie öffnen.`)}
${button(p_.openUrl, "Antwort öffnen")}
${box(
  `<p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:${C.text};">Der Button funktioniert in <strong>dem Browser, in dem Sie die Anfrage erstellt haben</strong> — dort ist Ihr Schlüssel gespeichert. Auf einem anderen Gerät öffnen Sie bitte Ihren gespeicherten Abruf-Link. Aus Sicherheitsgründen steht der Schlüssel nicht in dieser E-Mail.</p>`,
  { bg: C.soft, line: C.accent }
)}
${p(`Die Antwort wird nach dem ersten Abruf gelöscht, spätestens am <strong style="color:${C.ink};">${esc(fmtDate(p_.expiresAt))}</strong>.`, "font-size:14px;")}
${domainBox()}`,
    footerHtml: imprint(),
  });
  return { to: p_.to, subject, text, html };
}
