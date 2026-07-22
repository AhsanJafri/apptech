import { normalizeDomain } from '@/utils/validation';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details';
const FETCH_TIMEOUT_MS = 20000;

const PLAY_STORE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

export interface PlayStoreLookupResult {
  packageId: string;
  developerUrl: string;
  hostDomain: string;
}

function parseDeveloperUrlFromHtml(html: string): string | null {
  const patterns = [
    /<meta[^>]+name=["']appstore:developer_url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']appstore:developer_url["']/i,
    /"developerUrl"\s*:\s*"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/').trim();
    }
  }

  return null;
}

function domainFromDeveloperUrl(url: string): string {
  const withProtocol = url.startsWith('http') ? url : `https://${url}`;
  const hostname = new URL(withProtocol).hostname.replace(/^www\./, '');
  return normalizeDomain(hostname);
}

async function fetchPlayStoreHtml(packageId: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = `${PLAY_STORE_URL}?id=${encodeURIComponent(packageId)}&hl=en`;
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': PLAY_STORE_USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Google Play returned HTTP ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve developer website domain from a Google Play package ID. */
export async function resolveGooglePlayHostDomain(
  packageId: string
): Promise<PlayStoreLookupResult> {
  const normalizedPackage = packageId.trim().toLowerCase();
  const html = await fetchPlayStoreHtml(normalizedPackage);
  const developerUrl = parseDeveloperUrlFromHtml(html);

  if (!developerUrl) {
    throw new Error(
      'Could not find the developer website on Google Play. Make sure the app is published and has a website listed.'
    );
  }

  const hostDomain = domainFromDeveloperUrl(developerUrl);
  if (!hostDomain) {
    throw new Error('Developer website on Google Play is invalid.');
  }

  return {
    packageId: normalizedPackage,
    developerUrl,
    hostDomain,
  };
}

export function getPlayStoreUrl(packageId: string): string {
  return `${PLAY_STORE_URL}?id=${encodeURIComponent(packageId)}&hl=en`;
}
