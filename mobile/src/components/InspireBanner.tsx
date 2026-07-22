import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { colors } from '@/theme/colors';
import {
  getDailyQuote,
  getYouTubeThumbnailUrl,
  getYouTubeWatchUrl,
  INSPIRE_CONTENT,
} from '@/constants/inspire';

interface InspireBannerProps {
  showVideo?: boolean;
}

export function InspireBanner({ showVideo = false }: InspireBannerProps) {
  const quote = getDailyQuote();

  return (
    <View style={styles.wrap}>
      <View style={styles.quoteCard}>
        <Text style={styles.quoteText}>"{quote.text}"</Text>
        <Text style={styles.quoteAuthor}>— {quote.author}</Text>
      </View>

      {showVideo && (
        <TouchableOpacity
          style={styles.videoCard}
          onPress={() => Linking.openURL(getYouTubeWatchUrl(INSPIRE_CONTENT.youtubeVideoId))}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: getYouTubeThumbnailUrl(INSPIRE_CONTENT.youtubeVideoId) }}
            style={styles.thumbnail}
          />
          <View style={styles.videoMeta}>
            <Text style={styles.videoTitle}>{INSPIRE_CONTENT.youtubeTitle}</Text>
            <Text style={styles.videoSubtitle}>{INSPIRE_CONTENT.youtubeSubtitle}</Text>
            <Text style={styles.watchLink}>Tap to watch on YouTube</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  quoteCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
  videoCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnail: {
    width: '100%',
    height: 140,
    backgroundColor: colors.divider,
  },
  videoMeta: {
    padding: 14,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  videoSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  watchLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
});
