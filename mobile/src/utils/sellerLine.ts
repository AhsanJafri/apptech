import { TrackedLineMatchMode, TrackedLineStatus, TrackedLineResult, TrackedSellerLine } from '@/types';

const VALID_RELATIONSHIPS = ['DIRECT', 'RESELLER'] as const;

function normalizeSellerDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

export function parseSellerLineInput(
  input: string,
  matchMode: TrackedLineMatchMode
): {
  sellerDomain: string;
  publisherId: string;
  relationship: 'DIRECT' | 'RESELLER';
} | null {
  const line = input.trim().replace(/^#+\s*/, '');
  if (!line) return null;

  const parts = line.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  const sellerDomain = normalizeSellerDomain(parts[0]);
  if (!sellerDomain) return null;

  if (matchMode === 'partial') {
    const publisherId = parts[1] ?? '';
    return {
      sellerDomain,
      publisherId,
      relationship: 'RESELLER',
    };
  }

  if (parts.length < 2) return null;

  const publisherId = parts[1];
  const relationshipRaw = (parts[2] ?? 'RESELLER').toUpperCase();

  if (!publisherId) return null;
  if (!VALID_RELATIONSHIPS.includes(relationshipRaw as 'DIRECT' | 'RESELLER')) return null;

  return {
    sellerDomain,
    publisherId,
    relationship: relationshipRaw as 'DIRECT' | 'RESELLER',
  };
}

export function formatSellerLine(
  line: Pick<TrackedSellerLine, 'sellerDomain' | 'publisherId' | 'relationship' | 'matchMode'>
): string {
  if (line.matchMode === 'partial') {
    if (!line.publisherId) return line.sellerDomain;
    return `${line.sellerDomain}, ${line.publisherId}`;
  }

  return `${line.sellerDomain}, ${line.publisherId}, ${line.relationship}`;
}

export function sellerLinePlaceholder(matchMode: TrackedLineMatchMode): string {
  return matchMode === 'partial' ? 'bidscube.com' : 'bidscube.com, 123, RESELLER';
}

export function sellerLineHint(matchMode: TrackedLineMatchMode): string {
  return matchMode === 'partial'
    ? 'Partial accepts a domain only (bidscube.com) or domain + publisher ID (bidscube.com, 123).'
    : 'Exact requires the full line: domain, publisher ID, and DIRECT or RESELLER.';
}

const STATUS_PRIORITY: Record<TrackedLineStatus, number> = {
  found: 4,
  relationship_mismatch: 3,
  missing: 2,
  unknown: 1,
};

export function aggregateTrackedLineStatusUpdates(
  files: Array<{ trackedLineResults?: TrackedLineResult[] }>,
  checkedAt: string
): Array<{ lineId: string; status: TrackedLineStatus; checkedAt: string }> {
  const best = new Map<string, TrackedLineStatus>();

  for (const file of files) {
    for (const result of file.trackedLineResults ?? []) {
      const current = best.get(result.lineId);
      if (!current || STATUS_PRIORITY[result.status] > STATUS_PRIORITY[current]) {
        best.set(result.lineId, result.status);
      }
    }
  }

  return Array.from(best.entries()).map(([lineId, status]) => ({
    lineId,
    status,
    checkedAt,
  }));
}
