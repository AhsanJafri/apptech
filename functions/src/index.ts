import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { checkAdsTxt } from './adsTxtChecker';
import { sendAlert, shouldAlert } from './notifications';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Runs every 2 hours and checks all monitored domains for all users.
 * Schedule: 00:00, 02:00, 04:00, 06:00, 08:00, etc. UTC
 */
export const scheduledAdsTxtCheck = onSchedule(
  {
    schedule: '0 */2 * * *',
    timeZone: 'UTC',
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async () => {
    console.log('Starting scheduled ads.txt checks...');

    const usersSnap = await db.collection('users').get();
    let checked = 0;
    let alerted = 0;

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      const domainsSnap = await db.collection('users').doc(userId).collection('domains').get();

      for (const domainDoc of domainsSnap.docs) {
        const domain = domainDoc.data();
        const domainId = domainDoc.id;
        const previousStatus = domain.status;

        try {
          const result = await checkAdsTxt(domain.identifier);

          const checkRef = await db
            .collection('users')
            .doc(userId)
            .collection('domains')
            .doc(domainId)
            .collection('checks')
            .add({
              domainId,
              status: result.status,
              fileExists: result.fileExists,
              fileUrl: result.fileUrl,
              sellerCount: result.sellerCount,
              sellers: result.sellers,
              issues: result.issues,
              contentHash: result.contentHash,
              checkedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

          await domainDoc.ref.update({
            status: result.status,
            lastCheckId: checkRef.id,
            lastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          checked++;

          const needsAlert = await shouldAlert(userId, domainId, result.status, previousStatus);
          if (needsAlert) {
            await sendAlert({
              userId,
              domainId,
              email: userData.email,
              domainName: domain.name,
              identifier: domain.identifier,
              status: result.status,
              issues: result.issues,
              emailAlertsEnabled: userData.emailAlertsEnabled ?? true,
              telegramChatId: userData.telegramChatId,
              telegramAlertsEnabled: userData.telegramAlertsEnabled ?? false,
            });
            alerted++;
          }
        } catch (error) {
          console.error(`Check failed for ${domain.identifier}:`, error);
        }
      }
    }

    console.log(`Scheduled check complete. Checked: ${checked}, Alerted: ${alerted}`);
  }
);
