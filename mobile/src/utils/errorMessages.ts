import { AdsFileKind } from '@/types';

/** Turn raw network / Expo errors into short messages users can read. */
export function humanizeFetchError(error: unknown, fileType: AdsFileKind): string {
  const raw =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === 'string'
        ? error
        : String(error);

  const lower = raw.toLowerCase();

  if (lower.includes('timed out') || lower.includes('timeout') || lower.includes('aborted')) {
    return `${fileType}: The website took too long to respond. Try again.`;
  }
  if (lower.includes('network request failed') || lower.includes('failed to fetch')) {
    return `${fileType}: Could not reach the website. Check the domain or your connection.`;
  }
  if (lower.includes('ssl') || lower.includes('certificate')) {
    return `${fileType}: Secure connection failed (SSL/TLS issue).`;
  }
  if (lower.includes('not found') || lower.includes('404')) {
    return `${fileType}: File not found on this domain.`;
  }
  if (lower.includes('403') || lower.includes('forbidden')) {
    return `${fileType}: Access blocked by the website (403).`;
  }
  if (lower.includes('dns') || lower.includes('getaddrinfo')) {
    return `${fileType}: Domain could not be found (DNS).`;
  }

  return `${fileType}: Could not download the file. Please try again.`;
}

export function humanizeHttpStatus(status: number, fileType: AdsFileKind): string {
  switch (status) {
    case 404:
      return `${fileType}: File not found (404).`;
    case 403:
      return `${fileType}: Access blocked by the website (403).`;
    case 401:
      return `${fileType}: Login required to view this file (401).`;
    case 500:
    case 502:
    case 503:
      return `${fileType}: Website server error (${status}).`;
    default:
      return `${fileType}: Not available (HTTP ${status}).`;
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'warning':
      return 'Needs attention';
    case 'error':
      return 'Problem found';
    default:
      return 'Not checked yet';
  }
}
