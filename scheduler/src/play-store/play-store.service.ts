import { Injectable, Logger } from '@nestjs/common';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details';
const FETCH_TIMEOUT_MS = 20000;

const PLAY_STORE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

export interface PlayStoreLookupResult {
  packageId: string;
  developerUrl: string;
  hostDomain: string;
}

@Injectable()
export class PlayStoreService {
  private readonly logger = new Logger(PlayStoreService.name);

  private normalizeDomain(domain: string): string {
    return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  }

  private parseDeveloperUrlFromHtml(html: string): string | null {
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

  private domainFromDeveloperUrl(url: string): string {
    const withProtocol = url.startsWith('http') ? url : `https://${url}`;
    const hostname = new URL(withProtocol).hostname.replace(/^www\./, '');
    return this.normalizeDomain(hostname);
  }

  async resolveHostDomain(packageId: string): Promise<PlayStoreLookupResult> {
    const normalizedPackage = packageId.trim().toLowerCase();
    const url = `${PLAY_STORE_URL}?id=${encodeURIComponent(normalizedPackage)}&hl=en`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
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

      const html = await response.text();
      const developerUrl = this.parseDeveloperUrlFromHtml(html);

      if (!developerUrl) {
        throw new Error('Developer website not found on Google Play listing');
      }

      const hostDomain = this.domainFromDeveloperUrl(developerUrl);
      this.logger.log(`Resolved ${normalizedPackage} → ${hostDomain}`);

      return {
        packageId: normalizedPackage,
        developerUrl,
        hostDomain,
      };
    } catch (error) {
      this.logger.warn(`Play Store lookup failed for ${normalizedPackage}: ${error}`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
