export type DomainType = 'website' | 'app';

export type CheckStatus = 'healthy' | 'warning' | 'error' | 'unknown';

export type AdsFileKind = 'ads.txt' | 'app-ads.txt';

export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'business';

export interface AuthorizedSeller {
  domain: string;
  publisherId: string;
  relationship: 'DIRECT' | 'RESELLER';
  certificationAuthorityId?: string;
}

export interface CheckIssue {
  type:
    | 'missing_file'
    | 'invalid_format'
    | 'duplicate_entry'
    | 'unauthorized_seller'
    | 'missing_tracked_seller'
    | 'tracked_seller_mismatch'
    | 'fetch_error';
  message: string;
  line?: number;
  fileType?: AdsFileKind;
  trackedLineId?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface TrackedLineResult {
  lineId: string;
  status: TrackedLineStatus;
  fileType: AdsFileKind;
  matchedSeller?: AuthorizedSeller;
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
  /** All OwnerDomain values found in the file */
  ownerDomains?: string[];
  /** All ManagerDomain values found in the file */
  managerDomains?: string[];
  /** @deprecated use ownerDomains */
  ownerDomain?: string;
  contentHash?: string;
  trackedLineResults?: TrackedLineResult[];
}

export interface CheckResult {
  id: string;
  domainId: string;
  status: CheckStatus;
  fileExists: boolean;
  fileUrl: string;
  sellerCount: number;
  sellers: AuthorizedSeller[];
  issues: CheckIssue[];
  files: FileCheckResult[];
  rawContent?: string;
  contentHash?: string;
  checkedAt: string;
}

export interface MonitoredDomain {
  id: string;
  userId: string;
  name: string;
  identifier: string;
  type: DomainType;
  /** Website domain where ads/app-ads.txt is fetched (from Play Store for Google apps) */
  hostDomain?: string;
  /** Original developer URL from Google Play listing */
  developerUrl?: string;
  status: CheckStatus;
  monitoredFiles: AdsFileKind[];
  /** Push/email alert when this domain fails */
  notificationsEnabled: boolean;
  lastCheckedAt?: string;
  lastCheckId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  plan: SubscriptionPlan;
  domainLimit: number;
  telegramChatId?: string;
  emailAlertsEnabled: boolean;
  telegramAlertsEnabled: boolean;
  /** Expo push tokens for this device/account */
  expoPushTokens?: string[];
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface DomainsState {
  items: MonitoredDomain[];
  isLoading: boolean;
  error: string | null;
}

export interface ChecksState {
  byDomainId: Record<string, CheckResult[]>;
  isLoading: boolean;
  error: string | null;
}

export interface SellerLinesState {
  items: TrackedSellerLine[];
  isLoading: boolean;
  error: string | null;
}
