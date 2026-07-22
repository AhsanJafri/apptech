import Realm from 'realm';
import { MonitoredDomain, CheckResult, FileCheckResult } from '@/types';
import { trimCheckForCache } from '@/utils/checkPayload';

export class DomainSchema extends Realm.Object<DomainSchema> {
  id!: string;
  userId!: string;
  name!: string;
  identifier!: string;
  type!: string;
  status!: string;
  monitoredFilesJson!: string;
  hostDomain?: string;
  developerUrl?: string;
  notificationsEnabled!: boolean;
  lastCheckedAt?: string;
  lastCheckId?: string;
  createdAt!: string;
  updatedAt!: string;

  static schema: Realm.ObjectSchema = {
    name: 'Domain',
    primaryKey: 'id',
    properties: {
      id: 'string',
      userId: 'string',
      name: 'string',
      identifier: 'string',
      type: 'string',
      status: 'string',
      monitoredFilesJson: { type: 'string', default: '[]' },
      hostDomain: 'string?',
      developerUrl: 'string?',
      notificationsEnabled: { type: 'bool', default: true },
      lastCheckedAt: 'string?',
      lastCheckId: 'string?',
      createdAt: 'string',
      updatedAt: 'string',
    },
  };
}

export class CheckSchema extends Realm.Object<CheckSchema> {
  id!: string;
  domainId!: string;
  status!: string;
  fileExists!: boolean;
  fileUrl!: string;
  sellerCount!: number;
  sellersJson!: string;
  issuesJson!: string;
  filesJson!: string;
  contentHash?: string;
  checkedAt!: string;

  static schema: Realm.ObjectSchema = {
    name: 'Check',
    primaryKey: 'id',
    properties: {
      id: 'string',
      domainId: 'string',
      status: 'string',
      fileExists: 'bool',
      fileUrl: 'string',
      sellerCount: 'int',
      sellersJson: 'string',
      issuesJson: 'string',
      filesJson: { type: 'string', default: '[]' },
      contentHash: 'string?',
      checkedAt: 'string',
    },
  };
}

const realmConfig: Realm.Configuration = {
  schema: [DomainSchema, CheckSchema],
  schemaVersion: 5,
  onMigration: (oldRealm, newRealm) => {
    if (oldRealm.schemaVersion < 2) {
      const oldChecks = oldRealm.objects('Check');
      const newChecks = newRealm.objects<CheckSchema>('Check');
      for (let i = 0; i < oldChecks.length; i++) {
        newChecks[i].filesJson = '[]';
      }
    }
    if (oldRealm.schemaVersion < 3) {
      const oldDomains = oldRealm.objects('Domain');
      const newDomains = newRealm.objects<DomainSchema>('Domain');
      for (let i = 0; i < oldDomains.length; i++) {
        const type = String(oldDomains[i].type);
        newDomains[i].monitoredFilesJson = JSON.stringify(
          type === 'app' ? ['app-ads.txt'] : ['ads.txt', 'app-ads.txt']
        );
      }
    }
    if (oldRealm.schemaVersion < 4) {
      const newDomains = newRealm.objects<DomainSchema>('Domain');
      for (let i = 0; i < newDomains.length; i++) {
        newDomains[i].notificationsEnabled = true;
      }
    }
  },
};

let realmInstance: Realm | null = null;

function getRealm(): Realm {
  if (!realmInstance || realmInstance.isClosed) {
    realmInstance = new Realm(realmConfig);
  }
  return realmInstance;
}

function domainToRealm(domain: MonitoredDomain): Partial<DomainSchema> {
  return {
    id: domain.id,
    userId: domain.userId,
    name: domain.name,
    identifier: domain.identifier,
    type: domain.type,
    status: domain.status,
    monitoredFilesJson: JSON.stringify(domain.monitoredFiles ?? []),
    hostDomain: domain.hostDomain,
    developerUrl: domain.developerUrl,
    notificationsEnabled: domain.notificationsEnabled !== false,
    lastCheckedAt: domain.lastCheckedAt,
    lastCheckId: domain.lastCheckId,
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
  };
}

function realmToDomain(obj: DomainSchema): MonitoredDomain {
  let monitoredFiles: MonitoredDomain['monitoredFiles'] = [];
  try {
    monitoredFiles = JSON.parse(obj.monitoredFilesJson || '[]');
  } catch {
    monitoredFiles = obj.type === 'app' ? ['app-ads.txt'] : ['ads.txt', 'app-ads.txt'];
  }
  if (!monitoredFiles.length) {
    monitoredFiles = obj.type === 'app' ? ['app-ads.txt'] : ['ads.txt', 'app-ads.txt'];
  }

  return {
    id: obj.id,
    userId: obj.userId,
    name: obj.name,
    identifier: obj.identifier,
    type: obj.type as MonitoredDomain['type'],
    status: obj.status as MonitoredDomain['status'],
    monitoredFiles,
    hostDomain: obj.hostDomain,
    developerUrl: obj.developerUrl,
    notificationsEnabled: obj.notificationsEnabled !== false,
    lastCheckedAt: obj.lastCheckedAt,
    lastCheckId: obj.lastCheckId,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

function checkToRealm(check: CheckResult): Partial<CheckSchema> {
  return {
    id: check.id,
    domainId: check.domainId,
    status: check.status,
    fileExists: check.fileExists,
    fileUrl: check.fileUrl,
    sellerCount: check.sellerCount,
    sellersJson: JSON.stringify(check.sellers),
    issuesJson: JSON.stringify(check.issues),
    filesJson: JSON.stringify(check.files ?? []),
    contentHash: check.contentHash,
    checkedAt: check.checkedAt,
  };
}

function realmToCheck(obj: CheckSchema): CheckResult {
  let files: FileCheckResult[] = [];
  try {
    files = JSON.parse(obj.filesJson || '[]');
  } catch {
    files = [];
  }

  return {
    id: obj.id,
    domainId: obj.domainId,
    status: obj.status as CheckResult['status'],
    fileExists: obj.fileExists,
    fileUrl: obj.fileUrl,
    sellerCount: obj.sellerCount,
    sellers: JSON.parse(obj.sellersJson),
    issues: JSON.parse(obj.issuesJson),
    files,
    contentHash: obj.contentHash,
    checkedAt: obj.checkedAt,
  };
}

export const realmService = {
  saveDomain(domain: MonitoredDomain) {
    const realm = getRealm();
    realm.write(() => {
      realm.create('Domain', domainToRealm(domain), Realm.UpdateMode.Modified);
    });
  },

  saveDomains(domains: MonitoredDomain[]) {
    const realm = getRealm();
    realm.write(() => {
      domains.forEach((d) => {
        realm.create('Domain', domainToRealm(d), Realm.UpdateMode.Modified);
      });
    });
  },

  getDomains(userId: string): MonitoredDomain[] {
    const realm = getRealm();
    const results = realm.objects<DomainSchema>('Domain').filtered('userId == $0', userId);
    return Array.from(results).map(realmToDomain);
  },

  deleteDomain(domainId: string) {
    const realm = getRealm();
    realm.write(() => {
      const domain = realm.objectForPrimaryKey<DomainSchema>('Domain', domainId);
      if (domain) realm.delete(domain);
      const checks = realm.objects<CheckSchema>('Check').filtered('domainId == $0', domainId);
      realm.delete(checks);
    });
  },

  saveCheck(check: CheckResult) {
    const realm = getRealm();
    realm.write(() => {
      realm.create('Check', checkToRealm(trimCheckForCache(check)), Realm.UpdateMode.Modified);
    });
  },

  saveChecks(checks: CheckResult[]) {
    const realm = getRealm();
    realm.write(() => {
      checks.forEach((c) => {
        realm.create('Check', checkToRealm(trimCheckForCache(c)), Realm.UpdateMode.Modified);
      });
    });
  },

  getChecks(domainId: string): CheckResult[] {
    const realm = getRealm();
    const results = realm
      .objects<CheckSchema>('Check')
      .filtered('domainId == $0', domainId)
      .sorted('checkedAt', true);
    return Array.from(results).map(realmToCheck);
  },
};

export { realmConfig };
