import * as fs from "fs/promises";
import { randomBytes } from "crypto";

/**
 * Löscht eine Datei sicher: überschreibt sie zuerst mit Zufallsdaten,
 * bevor sie von der Disk entfernt wird. (DSGVO-konforme Datenlöschung)
 */
export async function secureDelete(filePath: string): Promise<void> {
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > 0) {
      const randomData = randomBytes(stats.size);
      await fs.writeFile(filePath, randomData);
    }
    await fs.unlink(filePath);
  } catch {
    // Falls Datei nicht mehr existiert — trotzdem versuchen zu löschen (ignoriere Fehler)
    await fs.unlink(filePath).catch(() => {});
  }
}
