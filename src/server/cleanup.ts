import cron from 'node-cron';
import { prisma } from './db';
import * as path from 'path';
import { secureDelete } from './storage';
import { deleteRequest } from './requests';

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

      // Datenanfragen: abgelaufen oder nicht rechtzeitig bestätigt
      const now = new Date();
      const requests = await prisma.dataRequest.findMany({
        where: {
          OR: [
            { expiresAt: { lte: now } },
            { status: 'PENDING_VERIFICATION', verifyExpiresAt: { lte: now } },
          ],
        },
        select: { id: true, responseFile: true },
      });
      for (const r of requests) await deleteRequest(r);
      if (requests.length > 0) {
        console.log(`[Cleanup] ${requests.length} Datenanfragen gelöscht.`);
      }

      // Rate-Limit-Zähler nach 48 h verwerfen
      await prisma.rateEvent.deleteMany({ where: { createdAt: { lte: new Date(Date.now() - 48 * 3600_000) } } });
    } catch (err) {
      console.error("[Cleanup] Fehler im Cronjob:", err);
    }
  });
}
