import {
  AdsFileKind,
  CheckIssue,
  CheckResult,
  CheckStatus,
  DomainType,
  FileCheckResult,
  TrackedSellerLine,
} from '@/types';
import { normalizeDomain } from '@/utils/validation';
import { humanizeFetchError, humanizeHttpStatus } from '@/utils/errorMessages';
import { formatSellerLine } from '@/utils/sellerLine';
import { hashContent, parseAdsTxt } from '@/services/adsTxt/parser';
import { matchTrackedLines } from '@/services/adsTxt/sellerMatcher';

const FETCH_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'text/plain,*/*',
        'User-Agent': 'AdsGuard-Monitor/1.0',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function worstStatus(statuses: CheckStatus[]): CheckStatus {
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('warning')) return 'warning';
  if (statuses.every((s) => s === 'healthy')) return 'healthy';
  return 'unknown';
}

function resolveCheckHost(
  identifier: string,
  type: DomainType,
  hostDomain?: string
): string | null {
  if (type === 'app') {
    if (hostDomain) return normalizeDomain(hostDomain);
    return null;
  }
  return normalizeDomain(identifier);
}

async function checkSingleFile(
  identifier: string,
  fileType: AdsFileKind,
  type: DomainType,
  hostDomain?: string
): Promise<FileCheckResult> {
  const domain = resolveCheckHost(identifier, type, hostDomain);
  if (!domain) {
    return {
      fileType,
      status: 'error',
      fileExists: false,
      fileUrl: '',
      sellerCount: 0,
      sellers: [],
      issues: [
        {
          type: 'fetch_error',
          message: `${fileType}: Developer website not configured. Remove and re-add this Google Play app.`,
          fileType,
        },
      ],
    };
  }
  const fileUrl = `https://${domain}/${fileType}`;

  try {
    const response = await fetchWithTimeout(fileUrl);

    if (!response.ok) {
      return {
        fileType,
        status: 'error',
        fileExists: false,
        fileUrl,
        sellerCount: 0,
        sellers: [],
        issues: [
          {
            type: 'missing_file',
            message: humanizeHttpStatus(response.status, fileType),
            fileType,
          },
        ],
      };
    }

    const rawContent = await response.text();

    if (!rawContent.trim()) {
      return {
        fileType,
        status: 'error',
        fileExists: true,
        fileUrl,
        sellerCount: 0,
        sellers: [],
        issues: [
          {
            type: 'invalid_format',
            message: `${fileType}: File exists but is empty.`,
            fileType,
          },
        ],
        contentHash: hashContent(rawContent),
      };
    }

    const { sellers, issues: parseIssues, variables, ownerDomains, managerDomains } =
      parseAdsTxt(rawContent);
    const issues: CheckIssue[] = parseIssues.map((issue) => ({
      ...issue,
      fileType,
      message: `${fileType}: ${issue.message.replace(/^Line /, 'Line ')}`,
    }));

    if (fileType === 'app-ads.txt' && ownerDomains.length === 0) {
      issues.push({
        type: 'invalid_format',
        message: `${fileType}: OwnerDomain is missing. Add OwnerDomain=yourdomain.com to identify the app owner.`,
        fileType,
      });
    }

    const status: CheckStatus = issues.length === 0 ? 'healthy' : 'warning';

    return {
      fileType,
      status,
      fileExists: true,
      fileUrl,
      sellerCount: sellers.length,
      sellers,
      issues,
      variables,
      ownerDomains,
      managerDomains,
      ownerDomain: ownerDomains[0],
      contentHash: hashContent(rawContent),
    };
  } catch (error) {
    return {
      fileType,
      status: 'error',
      fileExists: false,
      fileUrl,
      sellerCount: 0,
      sellers: [],
      issues: [
        {
          type: 'fetch_error',
          message: humanizeFetchError(error, fileType),
          fileType,
        },
      ],
    };
  }
}

function applyTrackedLineChecks(
  fileResult: FileCheckResult,
  trackedLines: TrackedSellerLine[]
): FileCheckResult {
  if (!trackedLines.length) {
    return fileResult;
  }

  const relevantLines = trackedLines.filter(
    (line) => !line.fileType || line.fileType === fileResult.fileType
  );
  if (!relevantLines.length) {
    return fileResult;
  }

  const trackedResults = fileResult.fileExists
    ? matchTrackedLines(fileResult.sellers, trackedLines, fileResult.fileType)
    : relevantLines.map((line) => ({
        lineId: line.id,
        status: 'missing' as const,
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
        message: `${fileResult.fileType}: Found ${label.split(',')[0]},${line.publisherId} but relationship differs`,
        fileType: fileResult.fileType,
        trackedLineId: line.id,
      });
    }
  }

  const hasTrackedIssue = trackedResults.some((result) => result.status !== 'found');
  const status: CheckStatus =
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

function filesToCheck(
  type: DomainType,
  monitoredFiles?: AdsFileKind[]
): AdsFileKind[] {
  if (monitoredFiles && monitoredFiles.length > 0) {
    return monitoredFiles.filter((f) => f === 'ads.txt' || f === 'app-ads.txt');
  }
  if (type === 'app') {
    return ['app-ads.txt'];
  }
  return ['ads.txt', 'app-ads.txt'];
}

export async function checkDomainFiles(
  domainId: string,
  identifier: string,
  type: DomainType,
  monitoredFiles?: AdsFileKind[],
  hostDomain?: string,
  trackedLines: TrackedSellerLine[] = []
): Promise<CheckResult> {
  const kinds = filesToCheck(type, monitoredFiles);
  if (kinds.length === 0) {
    return {
      id: `${domainId}-${Date.now()}`,
      domainId,
      status: 'unknown',
      fileExists: false,
      fileUrl: '',
      sellerCount: 0,
      sellers: [],
      issues: [
        {
          type: 'fetch_error',
          message: 'No files selected to monitor. Edit the domain and choose ads.txt and/or app-ads.txt.',
        },
      ],
      files: [],
      checkedAt: new Date().toISOString(),
    };
  }

  const filesRaw = await Promise.all(
    kinds.map((kind) => checkSingleFile(identifier, kind, type, hostDomain))
  );

  const files = filesRaw.map((file) => applyTrackedLineChecks(file, trackedLines));

  const issues = files.flatMap((f) => f.issues);
  const status = worstStatus(files.map((f) => f.status));
  const primary = files[0];
  const sellerCount = files.reduce((sum, f) => sum + f.sellerCount, 0);

  return {
    id: `${domainId}-${Date.now()}`,
    domainId,
    status,
    fileExists: files.some((f) => f.fileExists),
    fileUrl: primary.fileUrl,
    sellerCount,
    sellers: files.flatMap((f) => f.sellers),
    issues,
    files,
    contentHash: files.map((f) => f.contentHash).filter(Boolean).join('|') || undefined,
    checkedAt: new Date().toISOString(),
  };
}
