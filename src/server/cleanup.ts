import cron from 'node-cron';
import { prisma } from './db';
import * as path from 'path';
import { secureDelete } from './storage';

export function initCleanupScheduler() {
  console.log("[Scheduler] Initializing Secret Cleanup Cronjob...");

  cron.schedule('* * * * *', async () => {
    try {
      const expired = await prisma.secret.findMany({
        where: { expiresAt: { lte: new Date() } },
        select: { id: true, type: true }
      });

      for (const secret of expired) {
        // 1. Wenn FILE: sicher von Disk löschen (erst überschreiben, dann löschen)
        if (secret.type === 'FILE') {
          const filePath = path.join(process.env.UPLOAD_DIR || "./data/secrets", `${secret.id}.enc`);
          await secureDelete(filePath);
        }

        // 2. DB-Eintrag löschen
        await prisma.secret.delete({ where: { id: secret.id } }).catch(() => {});
      }

      if (expired.length > 0) {
        console.log(`[Cleanup] ${expired.length} abgelaufene Geheimnisse gelöscht.`);
      }
    } catch (err) {
      console.error("[Cleanup] Fehler im Cronjob:", err);
    }
  });
}
