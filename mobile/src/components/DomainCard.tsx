import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CheckStatus, MonitoredDomain } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/theme/colors';

interface DomainCardProps {
  domain: MonitoredDomain;
  onPress: () => void;
}

function statusAccentColor(status: CheckStatus) {
  if (status === 'healthy') return colors.success;
  if (status === 'warning') return colors.warning;
  if (status === 'error') return colors.error;
  return colors.textMuted;
}

function monitoredFilesLabel(domain: MonitoredDomain): string {
  const files =
    domain.monitoredFiles?.length > 0
      ? domain.monitoredFiles
      : domain.type === 'app'
        ? ['app-ads.txt']
        : ['ads.txt', 'app-ads.txt'];
  return files.join(' · ');
}

export function DomainCard({ domain, onPress }: DomainCardProps) {
  const typeLabel = domain.type === 'website' ? 'Website' : 'App';
  const lastChecked = domain.lastCheckedAt
    ? new Date(domain.lastCheckedAt).toLocaleString()
    : 'Not checked yet';

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: statusAccentColor(domain.status) }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <View style={styles.domainRow}>
          <View style={styles.domainIcon}>
            <Ionicons
              name={domain.type === 'website' ? 'globe-outline' : 'phone-portrait-outline'}
              size={16}
              color={colors.primary}
            />
          </View>
          <View style={styles.domainBody}>
            <Text style={styles.name} numberOfLines={1}>
              {domain.name}
            </Text>
            <Text style={styles.identifier} numberOfLines={1}>
              {domain.identifier}
            </Text>
            <Text style={styles.files}>{monitoredFilesLabel(domain)}</Text>
          </View>
        </View>
        <StatusBadge status={domain.status} size="sm" />
      </View>

      {domain.type === 'app' && domain.hostDomain ? (
        <View style={styles.hostBox}>
          <Text style={styles.hostLabel}>Host domain</Text>
          <Text style={styles.hostDomain} numberOfLines={1}>
            {domain.hostDomain}
          </Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>{typeLabel}</Text>
        </View>
        <View style={styles.metaPill}>
          <Ionicons
            name={domain.notificationsEnabled ? 'notifications' : 'notifications-off-outline'}
            size={12}
            color={colors.textMuted}
          />
          <Text style={styles.metaText}>
            {domain.notificationsEnabled ? 'Alerts on' : 'Alerts off'}
          </Text>
        </View>
        <Text style={styles.lastChecked}>{lastChecked}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  domainIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainBody: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  identifier: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  files: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  hostBox: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  hostLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  hostDomain: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.divider,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  lastChecked: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
});
