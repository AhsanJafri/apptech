import { Injectable, Logger } from '@nestjs/common';
import {
  AdsFileKind,
  AuthorizedSeller,
  CheckIssue,
  CheckResult,
  CheckStatus,
  FileCheckResult,
  TrackedSellerLine,
} from './ads-txt.types';
import { applyTrackedLineChecks } from './seller-matcher';

const VALID_RELATIONSHIPS = ['DIRECT', 'RESELLER'];
const FETCH_TIMEOUT_MS = 15000;

function stripBom(content: string): string {
  return content.replace(/^\uFEFF/, '');
}

function normalizeAdsTxtLine(rawLine: string): string {
  const trimmed = rawLine.replace(/^\uFEFF/, '').trim();
  const hashIndex = trimmed.indexOf('#');
  if (hashIndex === -1) return trimmed;
  return trimmed.slice(0, hashIndex).trimEnd();
}

function isSkippableAdsTxtLine(line: string): boolean {
  return !line || line.startsWith('#');
}

@Injectable()
export class AdsTxtService {
  private readonly logger = new Logger(AdsTxtService.name);

  parseAdsTxt(content: string): {
    sellers: AuthorizedSeller[];
    issues: CheckIssue[];
    variables: { name: string; value: string }[];
    ownerDomains: string[];
    managerDomains: string[];
  } {
    const sellers: AuthorizedSeller[] = [];
    const issues: CheckIssue[] = [];
    const variables: { name: string; value: string }[] = [];
    const ownerDomains: string[] = [];
    const managerDomains: string[] = [];
    const seen = new Set<string>();

    const pushUnique = (list: string[], value: string) => {
      const normalized = value.toLowerCase().trim();
      if (normalized && !list.includes(normalized)) list.push(normalized);
    };

    stripBom(content).split('\n').forEach((rawLine, index) => {
      const lineNumber = index + 1;
      const line = normalizeAdsTxtLine(rawLine);
      if (isSkippableAdsTxtLine(line)) return;

      const variableMatch = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
      if (variableMatch && !line.includes(',')) {
        const name = variableMatch[1];
        const value = variableMatch[2].trim();
        variables.push({ name, value });
        const key = name.toUpperCase();
        if (key === 'OWNERDOMAIN') pushUnique(ownerDomains, value);
        if (key === 'MANAGERDOMAIN') pushUnique(managerDomains, value);
        return;
      }

      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 3) {
        issues.push({
          type: 'invalid_format',
          message: `Line ${lineNumber}: invalid format`,
          line: lineNumber,
        });
        return;
      }

      const [domain, publisherId, relationship, certificationAuthorityId] = parts;
      const upperRelationship = relationship.toUpperCase();

      if (!VALID_RELATIONSHIPS.includes(upperRelationship)) {
        issues.push({
          type: 'invalid_format',
          message: `Line ${lineNumber}: invalid relationship`,
          line: lineNumber,
        });
        return;
      }

      const key = `${domain}|${publisherId}|${upperRelationship}`;
      if (seen.has(key)) {
        issues.push({
          type: 'duplicate_entry',
          message: `Line ${lineNumber}: duplicate entry`,
          line: lineNumber,
        });
        return;
      }
      seen.add(key);

      sellers.push({
        domain,
        publisherId,
        relationship: upperRelationship as 'DIRECT' | 'RESELLER',
        certificationAuthorityId: certificationAuthorityId || undefined,
      });
    });

    return { sellers, issues, variables, ownerDomains, managerDomains };
  }

  async checkAdsTxt(
    identifier: string,
    type: 'website' | 'app',
    monitoredFiles?: AdsFileKind[],
    hostDomain?: string,
    trackedLines: TrackedSellerLine[] = [],
  ): Promise<CheckResult> {
    const kinds: AdsFileKind[] =
      monitoredFiles && monitoredFiles.length > 0
        ? monitoredFiles.filter((f) => f === 'ads.txt' || f === 'app-ads.txt')
        : type === 'app'
          ? ['app-ads.txt']
          : ['ads.txt', 'app-ads.txt'];

    const filesRaw = await Promise.all(
      kinds.map((kind) => this.checkSingleFile(identifier, kind, type, hostDomain)),
    );
    const files = filesRaw.map((file) => applyTrackedLineChecks(file, trackedLines));
    const issues = files.flatMap((f) => f.issues);
    const status = this.worstStatus(files.map((f) => f.status));
    const primary = files[0];

    return {
      status,
      fileExists: files.some((f) => f.fileExists),
      fileUrl: primary?.fileUrl ?? '',
      sellerCount: files.reduce((sum, f) => sum + f.sellerCount, 0),
      sellers: files.flatMap((f) => f.sellers),
      issues,
      files,
      contentHash: files.map((f) => f.contentHash).filter(Boolean).join('|') || undefined,
    };
  }

  private resolveCheckHost(
    identifier: string,
    type: 'website' | 'app',
    hostDomain?: string,
  ): string | null {
    if (type === 'app') {
      if (hostDomain) return this.normalizeDomain(hostDomain);
      return null;
    }
    return this.normalizeDomain(identifier);
  }

  private async checkSingleFile(
    identifier: string,
    fileType: AdsFileKind,
    type: 'website' | 'app',
    hostDomain?: string,
  ): Promise<FileCheckResult> {
    const domain = this.resolveCheckHost(identifier, type, hostDomain);
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
            message: `${fileType}: Developer website not configured for this Google Play app.`,
            fileType,
          },
        ],
      };
    }
    const fileUrl = `https://${domain}/${fileType}`;

    try {
      const response = await this.fetchWithTimeout(fileUrl);

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
              message: this.humanizeHttpStatus(response.status, fileType),
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
          contentHash: this.hashContent(rawContent),
        };
      }

      const { sellers, issues: parseIssues, variables, ownerDomains, managerDomains } =
        this.parseAdsTxt(rawContent);
      const issues: CheckIssue[] = parseIssues.map((issue) => ({
        ...issue,
        fileType,
        message: `${fileType}: ${issue.message}`,
      }));

      if (fileType === 'app-ads.txt' && ownerDomains.length === 0) {
        issues.push({
          type: 'invalid_format',
          message: `${fileType}: OwnerDomain is missing. Add OwnerDomain=yourdomain.com to identify the app owner.`,
          fileType,
        });
      }

      return {
        fileType,
        status: issues.length === 0 ? 'healthy' : 'warning',
        fileExists: true,
        fileUrl,
        sellerCount: sellers.length,
        sellers,
        issues,
        variables,
        ownerDomains,
        managerDomains,
        ownerDomain: ownerDomains[0],
        contentHash: this.hashContent(rawContent),
      };
    } catch (error) {
      this.logger.warn(`Fetch failed for ${fileUrl}: ${error}`);
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
            message: this.humanizeFetchError(error, fileType),
            fileType,
          },
        ],
      };
    }
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      return await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'text/plain,*/*', 'User-Agent': 'AdsGuard-Monitor/1.0' },
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private humanizeHttpStatus(status: number, fileType: AdsFileKind): string {
    if (status === 404) return `${fileType}: File not found (404).`;
    if (status === 403) return `${fileType}: Access blocked by the website (403).`;
    if (status >= 500) return `${fileType}: Website server error (${status}).`;
    return `${fileType}: Not available (HTTP ${status}).`;
  }

  private humanizeFetchError(error: unknown, fileType: AdsFileKind): string {
    const raw = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (raw.includes('abort') || raw.includes('timeout')) {
      return `${fileType}: The website took too long to respond. Try again.`;
    }
    if (raw.includes('fetch') || raw.includes('network')) {
      return `${fileType}: Could not reach the website. Check the domain or your connection.`;
    }
    return `${fileType}: Could not download the file. Please try again.`;
  }

  private worstStatus(statuses: CheckStatus[]): CheckStatus {
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('warning')) return 'warning';
    if (statuses.every((s) => s === 'healthy')) return 'healthy';
    return 'unknown';
  }

  private normalizeDomain(domain: string): string {
    return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = (hash << 5) - hash + content.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(36);
  }
}
