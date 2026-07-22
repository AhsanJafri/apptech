import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { TrackedLineStatus, TrackedSellerLine } from '@/types';

function sellerLinesRef(userId: string) {
  return collection(getFirebaseDb(), 'users', userId, 'sellerLines');
}

function mapSellerLineDoc(id: string, data: Record<string, unknown>): TrackedSellerLine {
  return {
    id,
    userId: data.userId as string,
    domainId: data.domainId as string,
    sellerDomain: data.sellerDomain as string,
    publisherId: data.publisherId as string,
    relationship: data.relationship as TrackedSellerLine['relationship'],
    matchMode: (data.matchMode as TrackedSellerLine['matchMode']) ?? 'exact',
    fileType: data.fileType as TrackedSellerLine['fileType'],
    label: data.label as string | undefined,
    lastStatus: data.lastStatus as TrackedLineStatus | undefined,
    lastCheckedAt: (data.lastCheckedAt as { toDate?: () => Date })?.toDate?.()?.toISOString(),
    createdAt:
      (data.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString() ??
      new Date().toISOString(),
    updatedAt:
      (data.updatedAt as { toDate?: () => Date })?.toDate?.()?.toISOString() ??
      new Date().toISOString(),
  };
}

export async function getSellerLines(userId: string): Promise<TrackedSellerLine[]> {
  const snap = await getDocs(sellerLinesRef(userId));
  return snap.docs.map((d) => mapSellerLineDoc(d.id, d.data()));
}

export async function getSellerLinesForDomain(
  userId: string,
  domainId: string
): Promise<TrackedSellerLine[]> {
  const q = query(sellerLinesRef(userId), where('domainId', '==', domainId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapSellerLineDoc(d.id, d.data()));
}

export async function addSellerLine(
  userId: string,
  data: Omit<TrackedSellerLine, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastStatus' | 'lastCheckedAt'>
): Promise<TrackedSellerLine> {
  const payload = {
    userId,
    domainId: data.domainId,
    sellerDomain: data.sellerDomain.trim().toLowerCase(),
    publisherId: data.publisherId.trim(),
    relationship: data.relationship,
    matchMode: data.matchMode,
    ...(data.fileType ? { fileType: data.fileType } : {}),
    ...(data.label?.trim() ? { label: data.label.trim() } : {}),
    lastStatus: 'unknown' as TrackedLineStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(sellerLinesRef(userId), payload);
  return {
    id: docRef.id,
    userId,
    ...data,
    lastStatus: 'unknown',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function removeSellerLine(userId: string, lineId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'users', userId, 'sellerLines', lineId));
}

export async function updateSellerLineStatuses(
  userId: string,
  updates: Array<{ lineId: string; status: TrackedLineStatus; checkedAt: string }>
): Promise<void> {
  await Promise.all(
    updates.map(({ lineId, status, checkedAt }) =>
      updateDoc(doc(getFirebaseDb(), 'users', userId, 'sellerLines', lineId), {
        lastStatus: status,
        lastCheckedAt: checkedAt,
        updatedAt: serverTimestamp(),
      })
    )
  );
}
