// Merkt sich Abruf-Links (inkl. privatem Schlüssel) im Browser des Anfragenden,
// damit der Link aus der Benachrichtigungs-Mail (ohne Schlüssel) die Antwort
// direkt öffnen kann. Der Server bekommt den Schlüssel dadurch nie zu sehen.
// Einträge werden nach dem Abruf bzw. nach Ablauf entfernt.

const KEY = "ug-datenanfragen";
type Entry = { url: string; expiresAt: string };

function read(): Record<string, Entry> {
  try {
    const raw = window.localStorage.getItem(KEY);
    const data = raw ? (JSON.parse(raw) as Record<string, Entry>) : {};
    // Abgelaufene Einträge verwerfen
    const now = Date.now();
    for (const [id, e] of Object.entries(data)) {
      if (!e?.url || !(new Date(e.expiresAt).getTime() > now)) delete data[id];
    }
    return data;
  } catch {
    return {};
  }
}

function write(data: Record<string, Entry>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function saveRetrieval(id: string, url: string, expiresAt: string): boolean {
  const data = read();
  data[id] = { url, expiresAt };
  return write(data);
}

export function getRetrieval(id: string): string | null {
  return read()[id]?.url ?? null;
}

export function removeRetrieval(id: string) {
  const data = read();
  delete data[id];
  write(data);
}
