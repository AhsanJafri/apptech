import { AdsTxtVariable, AuthorizedSeller, CheckIssue } from '@/types';

const VALID_RELATIONSHIPS = ['DIRECT', 'RESELLER'] as const;

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

export interface ParseResult {
  sellers: AuthorizedSeller[];
  issues: CheckIssue[];
  variables: AdsTxtVariable[];
  ownerDomains: string[];
  managerDomains: string[];
}

function parseVariableLine(line: string): AdsTxtVariable | null {
  const match = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
  if (!match) return null;
  return {
    name: match[1],
    value: match[2].trim(),
  };
}

function uniquePush(list: string[], value: string) {
  const normalized = value.toLowerCase().trim();
  if (normalized && !list.includes(normalized)) {
    list.push(normalized);
  }
}

export function parseAdsTxt(content: string): ParseResult {
  const sellers: AuthorizedSeller[] = [];
  const issues: CheckIssue[] = [];
  const variables: AdsTxtVariable[] = [];
  const ownerDomains: string[] = [];
  const managerDomains: string[] = [];
  const seen = new Set<string>();

  stripBom(content).split('\n').forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = normalizeAdsTxtLine(rawLine);

    if (isSkippableAdsTxtLine(line)) {
      return;
    }

    const variable = parseVariableLine(line);
    if (variable && !line.includes(',')) {
      variables.push(variable);
      const key = variable.name.toUpperCase();
      if (key === 'OWNERDOMAIN') {
        uniquePush(ownerDomains, variable.value);
      } else if (key === 'MANAGERDOMAIN') {
        uniquePush(managerDomains, variable.value);
      }
      return;
    }

    const parts = line.split(',').map((p) => p.trim());

    if (parts.length < 3) {
      issues.push({
        type: 'invalid_format',
        message: `Line ${lineNumber}: expected at least 3 comma-separated fields`,
        line: lineNumber,
      });
      return;
    }

    const [domain, publisherId, relationship, certificationAuthorityId] = parts;

    if (!domain || !publisherId) {
      issues.push({
        type: 'invalid_format',
        message: `Line ${lineNumber}: domain and publisher ID are required`,
        line: lineNumber,
      });
      return;
    }

    const upperRelationship = relationship.toUpperCase();
    if (!VALID_RELATIONSHIPS.includes(upperRelationship as typeof VALID_RELATIONSHIPS[number])) {
      issues.push({
        type: 'invalid_format',
        message: `Line ${lineNumber}: relationship must be DIRECT or RESELLER`,
        line: lineNumber,
      });
      return;
    }

    const key = `${domain}|${publisherId}|${upperRelationship}`;
    if (seen.has(key)) {
      issues.push({
        type: 'duplicate_entry',
        message: `Line ${lineNumber}: duplicate seller entry`,
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

export function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}
