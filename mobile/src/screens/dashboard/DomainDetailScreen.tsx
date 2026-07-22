import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useSnackbar } from '@/components/Snackbar';
import {
  fetchCheckHistory,
  runManualCheck,
  loadChecksOffline,
} from '@/features/checks/checksSlice';
import { removeDomain, updateDomainStatus, updateDomainHost, setDomainNotifications, resolveAppHostDomain } from '@/features/domains/domainsSlice';
import { StatusBadge } from '@/components/StatusBadge';
import { CheckHistoryItem } from '@/components/CheckHistoryItem';
import { FileCheckCard } from '@/components/FileCheckCard';
import { MainStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'DomainDetail'>;
  route: RouteProp<MainStackParamList, 'DomainDetail'>;
};

export function DomainDetailScreen({ navigation, route }: Props) {
  const { domainId } = route.params;
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const { user } = useAppSelector((s) => s.auth);
  const domain = useAppSelector((s) => s.domains.items.find((d) => d.id === domainId));
  const checksByDomain = useAppSelector((s) => s.checks.byDomainId);
  const checks = useMemo(() => checksByDomain[domainId] ?? [], [checksByDomain, domainId]);
  const { isLoading } = useAppSelector((s) => s.checks);

  const loadData = useCallback(async () => {
    if (!user) return;
    await dispatch(loadChecksOffline(domainId));
    await dispatch(fetchCheckHistory({ userId: user.id, domainId }));
  }, [dispatch, user, domainId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user || !domain || domain.type !== 'app' || domain.hostDomain) return;
    void dispatch(resolveAppHostDomain({ userId: user.id, domain }));
  }, [dispatch, user, domain?.id, domain?.type, domain?.hostDomain]);

  const handleRunCheck = async () => {
    if (!user || !domain) return;
    const result = await dispatch(runManualCheck({ userId: user.id, domain }));
    if (runManualCheck.fulfilled.match(result)) {
      if (result.payload.domain.hostDomain) {
        dispatch(
          updateDomainHost({
            id: domainId,
            hostDomain: result.payload.domain.hostDomain,
            developerUrl: result.payload.domain.developerUrl,
          })
        );
      }
      dispatch(
        updateDomainStatus({
          id: domainId,
          status: result.payload.check.status,
          lastCheckedAt: result.payload.check.checkedAt,
        })
      );
    } else {
      const message =
        typeof result.payload === 'string'
          ? result.payload
          : 'Could not finish the check. Please try again.';
      showSnackbar(message, 'error');
    }
  };

  const handleDelete = () => {
    if (!user) return;
    Alert.alert('Remove Domain', `Stop monitoring ${domain?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await dispatch(removeDomain({ userId: user.id, domainId }));
          navigation.goBack();
        },
      },
    ]);
  };

  const handleToggleNotifications = async () => {
    if (!user || !domain) return;
    await dispatch(
      setDomainNotifications({
        userId: user.id,
        domainId,
        enabled: !domain.notificationsEnabled,
      })
    );
  };

  if (!domain) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Domain not found</Text>
      </View>
    );
  }

  const latestCheck = checks[0];
  const latestFiles =
    latestCheck?.files?.length
      ? latestCheck.files
      : latestCheck
        ? [
            {
              fileType: 'ads.txt' as const,
              status: latestCheck.status,
              fileExists: latestCheck.fileExists,
              fileUrl: latestCheck.fileUrl,
              sellerCount: latestCheck.sellerCount,
              sellers: latestCheck.sellers,
              issues: latestCheck.issues,
              contentHash: latestCheck.contentHash,
            },
          ]
        : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.name}>{domain.name}</Text>
          <Text style={styles.identifier}>{domain.identifier}</Text>
          {domain.type === 'app' && domain.hostDomain && (
            <Text style={styles.hostDomain}>Checks: {domain.hostDomain}</Text>
          )}
          <View style={styles.statusRow}>
            <StatusBadge status={domain.status} />
            <Text style={styles.typeLabel}>
              {domain.type === 'website' ? 'Website' : 'Google Play App'}
            </Text>
          </View>
          {domain.type === 'app' && domain.developerUrl && (
            <Text style={styles.developerUrl}>Developer site: {domain.developerUrl}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.notifyCard}
          onPress={handleToggleNotifications}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.notifyTitle}>Failure notifications</Text>
            <Text style={styles.notifyHint}>
              Push alert only when this domain check fails
            </Text>
          </View>
          <View
            style={[
              styles.notifyToggle,
              domain.notificationsEnabled && styles.notifyToggleOn,
            ]}
          >
            <Text style={styles.notifyToggleText}>
              {domain.notificationsEnabled ? 'ON' : 'OFF'}
            </Text>
          </View>
        </TouchableOpacity>

        {latestCheck && (
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Latest Check</Text>
            <Text style={styles.helper}>
              Monitoring:{' '}
              {(domain.monitoredFiles?.length
                ? domain.monitoredFiles
                : domain.type === 'app'
                  ? ['app-ads.txt']
                  : ['ads.txt', 'app-ads.txt']
              ).join(' · ')}
            </Text>

            {latestFiles.map((file) => (
              <FileCheckCard
                key={file.fileType}
                file={file}
                onShowMore={
                  latestCheck && file.issues.length > 2
                    ? () =>
                        navigation.navigate('CheckDetail', {
                          domainId,
                          checkId: latestCheck.id,
                          fileType: file.fileType,
                        })
                    : undefined
                }
              />
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.checkButton, isLoading && styles.buttonDisabled]}
            onPress={handleRunCheck}
            disabled={isLoading}
          >
            <Text style={styles.checkButtonText}>
              {isLoading
                ? 'Checking...'
                : `Run Check Now (${(domain.monitoredFiles?.length
                    ? domain.monitoredFiles
                    : domain.type === 'app'
                      ? ['app-ads.txt']
                      : ['ads.txt', 'app-ads.txt']
                  ).join(' + ')})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Remove Domain</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Check History</Text>
        {checks.length === 0 ? (
          <Text style={styles.noHistory}>No checks yet. Run your first check above.</Text>
        ) : (
          checks.map((check) => <CheckHistoryItem key={check.id} check={check} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  header: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  identifier: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  hostDomain: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  developerUrl: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  notifyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  notifyHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  notifyToggle: {
    backgroundColor: colors.divider,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  notifyToggleOn: {
    backgroundColor: colors.primaryLight,
  },
  notifyToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  helper: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  actions: {
    gap: 10,
    marginBottom: 24,
  },
  checkButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '500',
  },
  noHistory: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
