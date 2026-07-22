import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { CheckResult, FileCheckResult } from '@/types';
import { sanitizeCheckForStorage } from '@/utils/checkPayload';

function mapCheckDoc(d: { id: string; data: () => Record<string, unknown> }): CheckResult {
  const data = d.data();
  const files = (data.files as FileCheckResult[] | undefined) ?? [];
  return {
    id: d.id,
    domainId: data.domainId as string,
    status: data.status as CheckResult['status'],
    fileExists: data.fileExists as boolean,
    fileUrl: data.fileUrl as string,
    sellerCount: data.sellerCount as number,
    sellers: [],
    issues: (data.issues as CheckResult['issues']) ?? [],
    files,
    contentHash: data.contentHash as string | undefined,
    checkedAt:
      (data.checkedAt as { toDate?: () => Date })?.toDate?.()?.toISOString() ??
      (data.checkedAt as string) ??
      new Date().toISOString(),
  };
}

export async function getCheckHistory(
  userId: string,
  domainId: string,
  maxResults = 50
): Promise<CheckResult[]> {
  const q = query(
    collection(getFirebaseDb(), 'users', userId, 'domains', domainId, 'checks'),
    orderBy('checkedAt', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCheckDoc({ id: d.id, data: () => d.data() }));
}

export async function saveCheckResult(
  userId: string,
  domainId: string,
  result: CheckResult
): Promise<CheckResult> {
  const payload = {
    ...sanitizeCheckForStorage(result),
    checkedAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(getFirebaseDb(), 'users', userId, 'domains', domainId, 'checks'),
    payload
  );

  return { ...result, id: docRef.id, checkedAt: new Date().toISOString() };
}

export async function updateDomainAfterCheck(
  userId: string,
  domainId: string,
  result: CheckResult
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'users', userId, 'domains', domainId), {
    status: result.status,
    lastCheckId: result.id,
    lastCheckedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
