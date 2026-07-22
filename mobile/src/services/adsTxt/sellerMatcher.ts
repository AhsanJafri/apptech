import { AuthorizedSeller, AdsFileKind, TrackedLineResult, TrackedLineStatus, TrackedSellerLine } from '@/types';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function findCandidates(
  parsedSellers: AuthorizedSeller[],
  sellerDomain: string,
  publisherId: string,
  matchMode: TrackedSellerLine['matchMode']
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
  fileType: AdsFileKind
): TrackedLineResult[] {
  const relevant = trackedLines.filter((line) => !line.fileType || line.fileType === fileType);

  return relevant.map((line) => {
    const sellerDomain = normalize(line.sellerDomain);
    const publisherId = normalize(line.publisherId);

    const candidates = findCandidates(
      parsedSellers,
      sellerDomain,
      publisherId,
      line.matchMode
    );

    if (candidates.length === 0) {
      return {
        lineId: line.id,
        status: 'missing' as TrackedLineStatus,
        fileType,
      };
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
