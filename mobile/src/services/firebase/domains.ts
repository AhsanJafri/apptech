import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { MonitoredDomain, DomainType, AdsFileKind } from '@/types';
import { resolveGooglePlayHostDomain } from '@/services/playStore/resolver';

function normalizeMonitoredFiles(
  type: DomainType,
  files?: AdsFileKind[] | null
): AdsFileKind[] {
  if (files && files.length > 0) {
    return files.filter((f) => f === 'ads.txt' || f === 'app-ads.txt');
  }
  return type === 'app' ? ['app-ads.txt'] : ['ads.txt', 'app-ads.txt'];
}

function mapDomainDoc(userId: string, id: string, data: Record<string, unknown>): MonitoredDomain {
  const type = (data.type as DomainType) ?? 'website';
  return {
    id,
    userId: (data.userId as string) ?? userId,
    name: data.name as string,
    identifier: data.identifier as string,
    type,
    status: (data.status as MonitoredDomain['status']) ?? 'unknown',
    monitoredFiles: normalizeMonitoredFiles(type, data.monitoredFiles as AdsFileKind[] | undefined),
    hostDomain: data.hostDomain as string | undefined,
    developerUrl: data.developerUrl as string | undefined,
    notificationsEnabled: data.notificationsEnabled !== false,
    lastCheckedAt: (data.lastCheckedAt as { toDate?: () => Date })?.toDate?.()?.toISOString(),
    lastCheckId: data.lastCheckId as string | undefined,
    createdAt:
      (data.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString() ??
      new Date().toISOString(),
    updatedAt:
      (data.updatedAt as { toDate?: () => Date })?.toDate?.()?.toISOString() ??
      new Date().toISOString(),
  };
}

export async function getDomains(userId: string): Promise<MonitoredDomain[]> {
  const q = query(
    collection(getFirebaseDb(), 'users', userId, 'domains'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDomainDoc(userId, d.id, d.data()));
}

export interface AddDomainInput {
  name: string;
  identifier: string;
  type: DomainType;
  monitoredFiles: AdsFileKind[];
  notificationsEnabled?: boolean;
}

export async function addDomain(userId: string, data: AddDomainInput): Promise<MonitoredDomain> {
  const monitoredFiles = normalizeMonitoredFiles(data.type, data.monitoredFiles);
  const identifier = data.identifier.toLowerCase().trim();
  const notificationsEnabled = data.notificationsEnabled ?? true;
  const nowIso = new Date().toISOString();

  let hostDomain: string | undefined;
  let developerUrl: string | undefined;

  if (data.type === 'app') {
    const lookup = await resolveGooglePlayHostDomain(identifier);
    hostDomain = lookup.hostDomain;
    developerUrl = lookup.developerUrl;
  } else {
    hostDomain = identifier;
  }

  const payload = {
    userId,
    name: data.name,
    identifier,
    type: data.type,
    hostDomain,
    developerUrl,
    status: 'unknown' as const,
    monitoredFiles,
    notificationsEnabled,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(getFirebaseDb(), 'users', userId, 'domains'), payload);

  return {
    id: docRef.id,
    userId,
    name: data.name,
    identifier,
    type: data.type,
    status: 'unknown',
    hostDomain,
    developerUrl,
    monitoredFiles,
    notificationsEnabled,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export async function ensureAppHostDomain(
  userId: string,
  domain: MonitoredDomain
): Promise<MonitoredDomain> {
  if (domain.type !== 'app' || domain.hostDomain) {
    return domain;
  }

  const lookup = await resolveGooglePlayHostDomain(domain.identifier);
  await updateDoc(doc(getFirebaseDb(), 'users', userId, 'domains', domain.id), {
    hostDomain: lookup.hostDomain,
    developerUrl: lookup.developerUrl,
    updatedAt: serverTimestamp(),
  });

  return {
    ...domain,
    hostDomain: lookup.hostDomain,
    developerUrl: lookup.developerUrl,
    updatedAt: new Date().toISOString(),
  };
}

export async function removeDomain(userId: string, domainId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'users', userId, 'domains', domainId));
}

export async function updateDomainStatus(
  userId: string,
  domainId: string,
  status: MonitoredDomain['status'],
  lastCheckId: string
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'users', userId, 'domains', domainId), {
    status,
    lastCheckId,
    lastCheckedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function setDomainNotifications(
  userId: string,
  domainId: string,
  enabled: boolean
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'users', userId, 'domains', domainId), {
    notificationsEnabled: enabled,
    updatedAt: serverTimestamp(),
  });
}
