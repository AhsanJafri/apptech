import {
  AdsFileKind,
  AuthorizedSeller,
  TrackedLineResult,
  TrackedLineStatus,
  TrackedSellerLine,
} from './ads-txt.types';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function findCandidates(
  parsedSellers: AuthorizedSeller[],
  sellerDomain: string,
  publisherId: string,
  matchMode: TrackedSellerLine['matchMode'],
): AuthorizedSeller[] {
  return parsedSellers.filter((seller) => {
    if (normalize(seller.domain) !== sellerDomain) return false;
    if (matchMode === 'partial' && !publisherId) return true;
    return normalize(seller.publisherId) === publisherId;
  });
}

export function matchTrackedLines(
  parsedSellers: AuthorizedSeller[],
  trackedLines: TrackedSellerLine[],
  fileType: AdsFileKind,
): TrackedLineResult[] {
  const relevant = trackedLines.filter((line) => !line.fileType || line.fileType === fileType);

  return relevant.map((line) => {
    const sellerDomain = normalize(line.sellerDomain);
    const publisherId = normalize(line.publisherId);

    const candidates = findCandidates(
      parsedSellers,
      sellerDomain,
      publisherId,
      line.matchMode,
    );

    if (candidates.length === 0) {
      return { lineId: line.id, status: 'missing' as TrackedLineStatus, fileType };
    }

    if (line.matchMode === 'partial') {
      return {
        lineId: line.id,
        status: 'found' as TrackedLineStatus,
        fileType,
        matchedSeller: candidates[0],
      };
    }

    const exact = candidates.find((seller) => seller.relationship === line.relationship);
    if (exact) {
      return {
        lineId: line.id,
        status: 'found' as TrackedLineStatus,
        fileType,
        matchedSeller: exact,
      };
    }

    return {
      lineId: line.id,
      status: 'relationship_mismatch' as TrackedLineStatus,
      fileType,
      matchedSeller: candidates[0],
    };
  });
}

export function formatSellerLine(
  line: Pick<
    TrackedSellerLine,
    'sellerDomain' | 'publisherId' | 'relationship' | 'matchMode'
  >,
): string {
  if (line.matchMode === 'partial') {
    if (!line.publisherId) return line.sellerDomain;
    return `${line.sellerDomain}, ${line.publisherId}`;
  }

  return `${line.sellerDomain}, ${line.publisherId}, ${line.relationship}`;
}

const STATUS_PRIORITY: Record<TrackedLineStatus, number> = {
  found: 4,
  relationship_mismatch: 3,
  missing: 2,
  unknown: 1,
};

export function aggregateTrackedLineStatusUpdates(
  files: Array<{ trackedLineResults?: Array<{ lineId: string; status: TrackedLineStatus }> }>,
): Array<{ lineId: string; status: TrackedLineStatus }> {
  const best = new Map<string, TrackedLineStatus>();

  for (const file of files) {
    for (const result of file.trackedLineResults ?? []) {
      const current = best.get(result.lineId);
      if (!current || STATUS_PRIORITY[result.status] > STATUS_PRIORITY[current]) {
        best.set(result.lineId, result.status);
      }
    }
  }

  return Array.from(best.entries()).map(([lineId, status]) => ({ lineId, status }));
}

export function applyTrackedLineChecks<T extends {
  fileType: AdsFileKind;
  fileExists: boolean;
  status: string;
  sellers: AuthorizedSeller[];
  issues: Array<{ type: string; message: string; fileType?: AdsFileKind; trackedLineId?: string }>;
}>(
  fileResult: T,
  trackedLines: TrackedSellerLine[],
): T & { trackedLineResults?: TrackedLineResult[] } {
  if (!trackedLines.length) {
    return fileResult;
  }

  const relevantLines = trackedLines.filter(
    (line) => !line.fileType || line.fileType === fileResult.fileType,
  );
  if (!relevantLines.length) {
    return fileResult;
  }

  const trackedResults = fileResult.fileExists
    ? matchTrackedLines(fileResult.sellers, trackedLines, fileResult.fileType)
    : relevantLines.map((line) => ({
        lineId: line.id,
        status: 'missing' as TrackedLineStatus,
        fileType: fileResult.fileType,
      }));

  if (!trackedResults.length) return fileResult;

  const issues = [...fileResult.issues];
  const lineById = new Map(trackedLines.map((line) => [line.id, line]));

  for (const result of trackedResults) {
    const line = lineById.get(result.lineId);
    if (!line) continue;
    const label = formatSellerLine(line);

    if (result.status === 'missing') {
      issues.push({
        type: 'missing_tracked_seller',
        message: `${fileResult.fileType}: Tracked line missing: ${label}`,
        fileType: fileResult.fileType,
        trackedLineId: line.id,
      });
    } else if (result.status === 'relationship_mismatch') {
      issues.push({
        type: 'tracked_seller_mismatch',
        message: `${fileResult.fileType}: Found seller but relationship differs for ${label}`,
        fileType: fileResult.fileType,
        trackedLineId: line.id,
      });
    }
  }

  const hasTrackedIssue = trackedResults.some((result) => result.status !== 'found');
  const status =
    fileResult.status === 'error'
      ? 'error'
      : hasTrackedIssue || issues.length > 0
        ? 'warning'
        : 'healthy';

  return {
    ...fileResult,
    status,
    issues,
    trackedLineResults: trackedResults,
  };
}
