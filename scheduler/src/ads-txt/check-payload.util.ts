import { CheckResult, FileCheckResult } from './ads-txt.types';

const MAX_ISSUES_STORED = 50;

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as T;
  }

  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested !== undefined) {
        cleaned[key] = stripUndefinedDeep(nested);
      }
    }
    return cleaned as T;
  }

  return value;
}

function sanitizeIssues(issues: FileCheckResult['issues']) {
  return stripUndefinedDeep(issues.slice(0, MAX_ISSUES_STORED));
}

function sanitizeTrackedLineResults(results: FileCheckResult['trackedLineResults']) {
  if (!results?.length) return undefined;

  return results.map((result) =>
    stripUndefinedDeep({
      lineId: result.lineId,
      status: result.status,
      fileType: result.fileType,
      ...(result.matchedSeller ? { matchedSeller: result.matchedSeller } : {}),
    }),
  );
}

export function sanitizeFileForStorage(file: FileCheckResult): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    fileType: file.fileType,
    status: file.status,
    fileExists: file.fileExists,
    fileUrl: file.fileUrl,
    sellerCount: file.sellerCount,
    issues: sanitizeIssues(file.issues),
    ownerDomains: file.ownerDomains ?? [],
    managerDomains: file.managerDomains ?? [],
  };
  if (file.ownerDomain) payload.ownerDomain = file.ownerDomain;
  if (file.contentHash) payload.contentHash = file.contentHash;
  if (file.variables?.length) {
    payload.variables = file.variables.slice(0, 20);
  }
  const trackedLineResults = sanitizeTrackedLineResults(file.trackedLineResults);
  if (trackedLineResults?.length) {
    payload.trackedLineResults = trackedLineResults;
  }
  return payload;
}

export function sanitizeCheckForStorage(result: CheckResult): Record<string, unknown> {
  return stripUndefinedDeep({
    status: result.status,
    fileExists: result.fileExists,
    fileUrl: result.fileUrl,
    sellerCount: result.sellerCount,
    issues: sanitizeIssues(result.issues),
    files: (result.files ?? []).map(sanitizeFileForStorage),
    ...(result.contentHash ? { contentHash: result.contentHash } : {}),
  });
}
