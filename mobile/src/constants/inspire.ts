/** Inspirational content shown at the top of the dashboard */
export const INSPIRE_CONTENT = {
  quotes: [
    {
      text: 'Your ads.txt is your revenue firewall — guard it before fraud takes a cut.',
      author: 'AdsGuard',
    },
    {
      text: 'Every unauthorized seller in your file is money walking out the door.',
      author: 'IAB Tech Lab',
    },
    {
      text: 'Publishers who monitor ads.txt sleep better. Your revenue deserves that peace.',
      author: 'AdsGuard',
    },
  ],
  /** Google Ad Manager — setting up ads.txt (industry-standard intro) */
  youtubeVideoId: '8YWNYEzqxcY',
  youtubeTitle: 'Why ads.txt protects your ad revenue',
  youtubeSubtitle: 'Learn how authorized sellers keep fraud out of your inventory',
};

export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getDailyQuote() {
  const dayIndex = new Date().getDate() % INSPIRE_CONTENT.quotes.length;
  return INSPIRE_CONTENT.quotes[dayIndex];
}
