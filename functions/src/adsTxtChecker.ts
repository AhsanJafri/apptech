export interface AuthorizedSeller {
  domain: string;
  publisherId: string;
  relationship: 'DIRECT' | 'RESELLER';
  certificationAuthorityId?: string;
}

export interface CheckIssue {
  type: string;
  message: string;
  line?: number;
}

export interface CheckResult {
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  fileExists: boolean;
  fileUrl: string;
  sellerCount: number;
  sellers: AuthorizedSeller[];
  issues: CheckIssue[];
  contentHash?: string;
}

const VALID_RELATIONSHIPS = ['DIRECT', 'RESELLER'];

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

export function parseAdsTxt(content: string): { sellers: AuthorizedSeller[]; issues: CheckIssue[] } {
  const sellers: AuthorizedSeller[] = [];
  const issues: CheckIssue[] = [];
  const seen = new Set<string>();

  stripBom(content).split('\n').forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = normalizeAdsTxtLine(rawLine);
    if (isSkippableAdsTxtLine(line)) return;

    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 3) {
      issues.push({ type: 'invalid_format', message: `Line ${lineNumber}: invalid format`, line: lineNumber });
      return;
    }

    const [domain, publisherId, relationship, certificationAuthorityId] = parts;
    const upperRelationship = relationship.toUpperCase();

    if (!VALID_RELATIONSHIPS.includes(upperRelationship)) {
      issues.push({ type: 'invalid_format', message: `Line ${lineNumber}: invalid relationship`, line: lineNumber });
      return;
    }

    const key = `${domain}|${publisherId}|${upperRelationship}`;
    if (seen.has(key)) {
      issues.push({ type: 'duplicate_entry', message: `Line ${lineNumber}: duplicate entry`, line: lineNumber });
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

  return { sellers, issues };
}

function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

export async function checkAdsTxt(identifier: string): Promise<CheckResult> {
  const domain = normalizeDomain(identifier);
  const fileUrl = `https://${domain}/ads.txt`;

  try {
    const response = await fetch(fileUrl, {
      headers: { Accept: 'text/plain', 'User-Agent': 'AdsGuard-Monitor/1.0' },
    });

    if (!response.ok) {
      return {
        status: 'error',
        fileExists: false,
        fileUrl,
        sellerCount: 0,
        sellers: [],
        issues: [{ type: 'missing_file', message: `ads.txt not found (HTTP ${response.status})` }],
      };
    }

    const rawContent = await response.text();
    if (!rawContent.trim()) {
      return {
        status: 'error',
        fileExists: true,
        fileUrl,
        sellerCount: 0,
        sellers: [],
        issues: [{ type: 'invalid_format', message: 'ads.txt file is empty' }],
        contentHash: hashContent(rawContent),
      };
    }

    const { sellers, issues } = parseAdsTxt(rawContent);
    const status = issues.length === 0 ? 'healthy' : 'warning';

    return {
      status,
      fileExists: true,
      fileUrl,
      sellerCount: sellers.length,
      sellers,
      issues,
      contentHash: hashContent(rawContent),
    };
  } catch (error) {
    return {
      status: 'error',
      fileExists: false,
      fileUrl,
      sellerCount: 0,
      sellers: [],
      issues: [{ type: 'fetch_error', message: error instanceof Error ? error.message : 'Fetch failed' }],
    };
  }
}
