import { View, Text, StyleSheet } from 'react-native';
import { CheckStatus } from '@/types';
import { colors } from '@/theme/colors';

const STATUS_CONFIG: Record<CheckStatus, { label: string; bg: string; text: string }> = {
  healthy: { label: 'Healthy', bg: colors.successLight, text: colors.success },
  warning: { label: 'Warning', bg: colors.warningLight, text: colors.warning },
  error: { label: 'Error', bg: colors.errorLight, text: colors.error },
  unknown: { label: 'Unknown', bg: colors.divider, text: colors.textMuted },
};

interface StatusBadgeProps {
  status: CheckStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, size === 'sm' && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.label, { color: config.text }, size === 'sm' && styles.labelSm]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 11,
  },
});
