export type CheckStatus = 'healthy' | 'warning' | 'error' | 'unknown';
export type AdsFileKind = 'ads.txt' | 'app-ads.txt';

export interface AuthorizedSeller {
  domain: string;
  publisherId: string;
  relationship: 'DIRECT' | 'RESELLER';
  certificationAuthorityId?: string;
}

export interface CheckIssue {
  type: string;
  message: string;
  line?: number;
  fileType?: AdsFileKind;
}

export interface AdsTxtVariable {
  name: string;
  value: string;
}

export interface FileCheckResult {
  fileType: AdsFileKind;
  status: CheckStatus;
  fileExists: boolean;
  fileUrl: string;
  sellerCount: number;
  sellers: AuthorizedSeller[];
  issues: CheckIssue[];
  variables?: AdsTxtVariable[];
  ownerDomains?: string[];
  managerDomains?: string[];
  ownerDomain?: string;
  contentHash?: string;
  trackedLineResults?: TrackedLineResult[];
}

export type TrackedLineMatchMode = 'exact' | 'partial';
export type TrackedLineStatus = 'found' | 'missing' | 'relationship_mismatch' | 'unknown';

export interface TrackedSellerLine {
  id: string;
  userId: string;
  domainId: string;
  sellerDomain: string;
  publisherId: string;
  relationship: 'DIRECT' | 'RESELLER';
  matchMode: TrackedLineMatchMode;
  fileType?: AdsFileKind;
  label?: string;
  lastStatus?: TrackedLineStatus;
  lastCheckedAt?: string;
}

export interface TrackedLineResult {
  lineId: string;
  status: TrackedLineStatus;
  fileType: AdsFileKind;
  matchedSeller?: AuthorizedSeller;
}

export interface CheckResult {
  status: CheckStatus;
  fileExists: boolean;
  fileUrl: string;
  sellerCount: number;
  sellers: AuthorizedSeller[];
  issues: CheckIssue[];
  files: FileCheckResult[];
  contentHash?: string;
}

export interface DomainRecord {
  id: string;
  name: string;
  identifier: string;
  type: 'website' | 'app';
  hostDomain?: string;
  developerUrl?: string;
  status?: string;
  monitoredFiles?: AdsFileKind[];
  notificationsEnabled?: boolean;
}

export interface UserRecord {
  id: string;
  email: string;
  emailAlertsEnabled: boolean;
  telegramChatId?: string;
  telegramAlertsEnabled: boolean;
  expoPushTokens?: string[];
}
