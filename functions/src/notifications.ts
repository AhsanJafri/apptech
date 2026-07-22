import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface AlertPayload {
  userId: string;
  email: string;
  domainName: string;
  identifier: string;
  status: string;
  issues: { message: string }[];
  emailAlertsEnabled: boolean;
  telegramChatId?: string;
  telegramAlertsEnabled: boolean;
}

export async function sendAlert(payload: AlertPayload & { domainId: string }): Promise<void> {
  const { userId, domainId, domainName, status, issues } = payload;

  await db.collection('alerts').add({
    userId,
    domainId,
    domainName,
    status,
    issues,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    sent: false,
  });

  if (payload.emailAlertsEnabled && payload.email) {
    // Wire up SendGrid, Resend, or Firebase Extensions "Trigger Email" here
    console.log(`[EMAIL ALERT] To: ${payload.email} | Domain: ${domainName} | Status: ${status}`);
  }

  if (payload.telegramAlertsEnabled && payload.telegramChatId) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      const message = `⚠️ AdsGuard Alert\n\nDomain: ${domainName}\nStatus: ${status}\n\n${issues.map((i) => `• ${i.message}`).join('\n')}`;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: payload.telegramChatId, text: message }),
      });
    }
  }
}

export async function shouldAlert(
  userId: string,
  domainId: string,
  newStatus: string,
  previousStatus?: string
): Promise<boolean> {
  if (newStatus === 'healthy') return false;
  if (previousStatus === newStatus) return false;

  const recentAlerts = await db
    .collection('alerts')
    .where('userId', '==', userId)
    .where('domainId', '==', domainId)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!recentAlerts.empty) {
    const lastAlert = recentAlerts.docs[0].data();
    const lastAlertTime = lastAlert.createdAt?.toDate?.();
    if (lastAlertTime) {
      const hoursSince = (Date.now() - lastAlertTime.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 6) return false;
    }
  }

  return true;
}
