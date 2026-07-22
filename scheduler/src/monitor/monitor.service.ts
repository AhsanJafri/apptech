import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { AdsTxtService } from '../ads-txt/ads-txt.service';
import { DomainRecord, TrackedLineResult, TrackedSellerLine, UserRecord } from '../ads-txt/ads-txt.types';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlayStoreService } from '../play-store/play-store.service';
import { sanitizeCheckForStorage } from '../ads-txt/check-payload.util';
import { aggregateTrackedLineStatusUpdates } from '../ads-txt/seller-matcher';
import { DocumentData } from 'firebase-admin/firestore';

@Injectable()
export class MonitorService implements OnModuleInit {
  private readonly logger = new Logger(MonitorService.name);
  private isRunning = false;

  constructor(
    private readonly firebase: FirebaseService,
    private readonly adsTxt: AdsTxtService,
    private readonly notifications: NotificationsService,
    private readonly playStore: PlayStoreService,
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const schedule = this.config.get<string>('CRON_SCHEDULE', '0 */2 * * *');
    const job = new CronJob(schedule, () => {
      void this.runAllChecks();
    });
    this.schedulerRegistry.addCronJob('ads-txt-check', job);
    job.start();
    this.logger.log(`Cron registered: ${schedule}`);

    if (this.config.get<string>('RUN_ON_STARTUP') === 'true') {
      this.logger.log('RUN_ON_STARTUP=true — running initial check...');
      void this.runAllChecks();
    }
  }

  async runAllChecks(): Promise<{ checked: number; alerted: number }> {
    if (this.isRunning) {
      this.logger.warn('Previous check still running, skipping this run');
      return { checked: 0, alerted: 0 };
    }

    this.isRunning = true;
    this.logger.log('Starting scheduled ads.txt checks...');

    let checked = 0;
    let alerted = 0;

    try {
      const usersSnap = await this.firebase.firestore.collection('users').get();

      for (const userDoc of usersSnap.docs) {
        const user = this.mapUser(userDoc.id, userDoc.data());
        const domainsSnap = await this.firebase.firestore
          .collection('users')
          .doc(user.id)
          .collection('domains')
          .get();

        const sellerLinesSnap = await this.firebase.firestore
          .collection('users')
          .doc(user.id)
          .collection('sellerLines')
          .get();
        const sellerLinesByDomain = this.groupSellerLines(sellerLinesSnap.docs);

        for (const domainDoc of domainsSnap.docs) {
          let domain = this.mapDomain(domainDoc.id, domainDoc.data());
          const previousStatus = domainDoc.data().status as string | undefined;
          const trackedLines = sellerLinesByDomain.get(domain.id) ?? [];

          try {
            if (domain.type === 'app' && !domain.hostDomain) {
              const lookup = await this.playStore.resolveHostDomain(domain.identifier);
              domain = { ...domain, hostDomain: lookup.hostDomain, developerUrl: lookup.developerUrl };
              await domainDoc.ref.update({
                hostDomain: lookup.hostDomain,
                developerUrl: lookup.developerUrl,
                updatedAt: this.firebase.FieldValue.serverTimestamp(),
              });
            }

            const result = await this.adsTxt.checkAdsTxt(
              domain.identifier,
              domain.type,
              domain.monitoredFiles,
              domain.hostDomain,
              trackedLines,
            );

            const checkedAtIso = new Date().toISOString();
            await this.updateTrackedLineStatuses(user.id, result, checkedAtIso);

            const checkPayload: Record<string, unknown> = {
              domainId: domain.id,
              ...sanitizeCheckForStorage(result),
              checkedAt: this.firebase.FieldValue.serverTimestamp(),
            };

            const checkRef = await this.firebase.firestore
              .collection('users')
              .doc(user.id)
              .collection('domains')
              .doc(domain.id)
              .collection('checks')
              .add(checkPayload);

            await domainDoc.ref.update({
              status: result.status,
              lastCheckId: checkRef.id,
              lastCheckedAt: this.firebase.FieldValue.serverTimestamp(),
              updatedAt: this.firebase.FieldValue.serverTimestamp(),
            });

            checked++;

            const needsAlert = await this.notifications.shouldAlert(
              user.id,
              domain.id,
              result.status,
              previousStatus,
              domain.notificationsEnabled !== false,
            );

            if (needsAlert) {
              await this.notifications.sendAlert({
                userId: user.id,
                domainId: domain.id,
                email: user.email,
                domainName: domain.name,
                identifier: domain.identifier,
                status: result.status,
                issues: result.issues,
                emailAlertsEnabled: user.emailAlertsEnabled,
                telegramChatId: user.telegramChatId,
                telegramAlertsEnabled: user.telegramAlertsEnabled,
                expoPushTokens: user.expoPushTokens,
                notificationsEnabled: domain.notificationsEnabled !== false,
              });
              alerted++;
            }
          } catch (error) {
            this.logger.error(`Check failed for ${domain.identifier}`, error);
          }
        }
      }

      this.logger.log(`Scheduled check complete. Checked: ${checked}, Alerted: ${alerted}`);
      return { checked, alerted };
    } finally {
      this.isRunning = false;
    }
  }

  private mapUser(id: string, data: DocumentData): UserRecord {
    return {
      id,
      email: data.email ?? '',
      emailAlertsEnabled: data.emailAlertsEnabled ?? true,
      telegramChatId: data.telegramChatId,
      telegramAlertsEnabled: data.telegramAlertsEnabled ?? false,
      expoPushTokens: Array.isArray(data.expoPushTokens) ? data.expoPushTokens : [],
    };
  }

  private mapDomain(id: string, data: DocumentData): DomainRecord {
    const type = data.type ?? 'website';
    const monitoredFiles = Array.isArray(data.monitoredFiles)
      ? data.monitoredFiles
      : type === 'app'
        ? ['app-ads.txt']
        : ['ads.txt', 'app-ads.txt'];

    return {
      id,
      name: data.name,
      identifier: data.identifier,
      type,
      hostDomain: data.hostDomain as string | undefined,
      developerUrl: data.developerUrl as string | undefined,
      status: data.status,
      monitoredFiles,
      notificationsEnabled: data.notificationsEnabled !== false,
    };
  }

  private groupSellerLines(
    docs: Array<{ id: string; data: () => DocumentData }>,
  ): Map<string, TrackedSellerLine[]> {
    const grouped = new Map<string, TrackedSellerLine[]>();

    for (const docSnap of docs) {
      const data = docSnap.data();
      const line: TrackedSellerLine = {
        id: docSnap.id,
        userId: data.userId as string,
        domainId: data.domainId as string,
        sellerDomain: data.sellerDomain as string,
        publisherId: data.publisherId as string,
        relationship: data.relationship as TrackedSellerLine['relationship'],
        matchMode: (data.matchMode as TrackedSellerLine['matchMode']) ?? 'exact',
        fileType: data.fileType as TrackedSellerLine['fileType'],
        label: data.label as string | undefined,
        lastStatus: data.lastStatus as TrackedSellerLine['lastStatus'],
      };

      const existing = grouped.get(line.domainId) ?? [];
      existing.push(line);
      grouped.set(line.domainId, existing);
    }

    return grouped;
  }

  private async updateTrackedLineStatuses(
    userId: string,
    result: { files?: Array<{ trackedLineResults?: TrackedLineResult[] }> },
    checkedAtIso: string,
  ): Promise<void> {
    const updates = aggregateTrackedLineStatusUpdates(result.files ?? []);

    if (!updates.length) return;

    await Promise.all(
      updates.map((update) =>
        this.firebase.firestore
          .collection('users')
          .doc(userId)
          .collection('sellerLines')
          .doc(update.lineId)
          .update({
            lastStatus: update.status,
            lastCheckedAt: checkedAtIso,
            updatedAt: this.firebase.FieldValue.serverTimestamp(),
          }),
      ),
    );
  }
}
