import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../firebase/firebase.service';

interface AlertPayload {
  userId: string;
  domainId: string;
  email: string;
  domainName: string;
  identifier: string;
  status: string;
  issues: { message: string }[];
  emailAlertsEnabled: boolean;
  telegramChatId?: string;
  telegramAlertsEnabled: boolean;
  expoPushTokens?: string[];
  notificationsEnabled: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly config: ConfigService,
  ) {}

  async sendAlert(payload: AlertPayload): Promise<void> {
    if (!payload.notificationsEnabled) {
      this.logger.log(
        `Skipping alert for ${payload.domainName} — domain notifications disabled`,
      );
      return;
    }

    // Only push for hard failures
    if (payload.status !== 'error') {
      return;
    }

    const { userId, domainId, domainName, status, issues } = payload;
    const summary =
      issues[0]?.message ?? 'ads.txt / app-ads.txt check failed';

    await this.firebase.firestore.collection('alerts').add({
      userId,
      domainId,
      domainName,
      identifier: payload.identifier,
      status,
      issues,
      type: 'domain_failure',
      createdAt: this.firebase.FieldValue.serverTimestamp(),
      sent: true,
      channel: 'push',
    });

    await this.sendExpoPush(payload.expoPushTokens ?? [], {
      title: `${domainName} is failing`,
      body: summary,
      data: {
        domainId,
        identifier: payload.identifier,
        type: 'domain_failure',
      },
    });

    if (payload.emailAlertsEnabled && payload.email) {
      this.logger.log(
        `[EMAIL ALERT] To: ${payload.email} | Domain: ${domainName} | Status: ${status}`,
      );
    }

    if (payload.telegramAlertsEnabled && payload.telegramChatId) {
      const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
      if (botToken) {
        const message = `⚠️ AdsGuard\n\n${domainName} is failing\n${payload.identifier}\n\n${summary}`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: payload.telegramChatId, text: message }),
        });
      }
    }
  }

  private async sendExpoPush(
    tokens: string[],
    message: { title: string; body: string; data?: Record<string, string> },
  ): Promise<void> {
    const uniqueTokens = [...new Set(tokens.filter((t) => t.startsWith('ExponentPushToken')))];
    if (!uniqueTokens.length) {
      this.logger.warn('No Expo push tokens available for user');
      return;
    }

    const messages = uniqueTokens.map((to) => ({
      to,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: message.data ?? {},
      priority: 'high',
      channelId: 'adsguard-alerts',
    }));

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
      const result = await response.json();
      this.logger.log(`Expo push sent: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error('Failed to send Expo push', error);
    }
  }

  /**
   * Alert only when a domain newly fails (error), and only if enough time passed.
   */
  async shouldAlert(
    userId: string,
    domainId: string,
    newStatus: string,
    previousStatus?: string,
    notificationsEnabled = true,
  ): Promise<boolean> {
    if (!notificationsEnabled) return false;
    if (newStatus !== 'error') return false;
    if (previousStatus === 'error') return false;

    const recentAlerts = await this.firebase.firestore
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
}
