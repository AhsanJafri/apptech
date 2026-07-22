import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDomains } from '@/features/domains/domainsSlice';
import { fetchSellerLines, refreshTrackedLineChecks, removeSellerLine } from '@/features/sellerLines/sellerLinesSlice';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { MainStackParamList, MainTabParamList } from '@/navigation/types';
import { TrackedLineStatus, TrackedSellerLine } from '@/types';
import { formatSellerLine } from '@/utils/sellerLine';
import { useSnackbar } from '@/components/Snackbar';
import { colors } from '@/theme/colors';

type SellerLinesNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'SellerLinesTab'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type Props = {
  navigation: SellerLinesNavigation;
};

function lineStatusToCheckStatus(status?: TrackedLineStatus) {
  if (status === 'found') return 'healthy' as const;
  if (status === 'missing' || status === 'relationship_mismatch') return 'warning' as const;
  return 'unknown' as const;
}

function lineStatusLabel(status?: TrackedLineStatus) {
  if (status === 'found') return 'Found';
  if (status === 'missing') return 'Missing';
  if (status === 'relationship_mismatch') return 'Mismatch';
  return 'Not checked';
}

function statusAccentColor(status?: TrackedLineStatus) {
  if (status === 'found') return colors.success;
  if (status === 'missing' || status === 'relationship_mismatch') return colors.warning;
  return colors.textMuted;
}

export function SellerLinesScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const { user } = useAppSelector((s) => s.auth);
  const { items: domains } = useAppSelector((s) => s.domains);
  const { items: sellerLines, isLoading } = useAppSelector((s) => s.sellerLines);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    await dispatch(fetchDomains(user.id));
    await dispatch(fetchSellerLines(user.id));
  }, [dispatch, user]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await dispatch(fetchDomains(user.id));
    await dispatch(fetchSellerLines(user.id));
    await dispatch(refreshTrackedLineChecks(user.id));
    setRefreshing(false);
  };

  const stats = useMemo(() => {
    const found = sellerLines.filter((line) => line.lastStatus === 'found').length;
    const missing = sellerLines.filter(
      (line) => line.lastStatus === 'missing' || line.lastStatus === 'relationship_mismatch'
    ).length;
    return { total: sellerLines.length, found, missing };
  }, [sellerLines]);

  const domainName = (domainId: string) =>
    domains.find((domain) => domain.id === domainId)?.name ?? 'Unknown domain';

  const domainFilesLabel = (domainId: string) => {
    const domain = domains.find((item) => item.id === domainId);
    if (!domain) return 'Unknown files';
    const files =
      domain.monitoredFiles?.length > 0
        ? domain.monitoredFiles
        : domain.type === 'app'
          ? ['app-ads.txt']
          : ['ads.txt', 'app-ads.txt'];
    return files.join(' · ');
  };

  const handleDelete = async (line: TrackedSellerLine) => {
    if (!user) return;
    const result = await dispatch(removeSellerLine({ userId: user.id, lineId: line.id }));
    if (removeSellerLine.fulfilled.match(result)) {
      showSnackbar(`Stopped tracking line for ${domainName(line.domainId)}`, 'success');
    } else {
      showSnackbar('Could not remove seller line. Please try again.', 'error');
    }
  };

  if (isLoading && sellerLines.length === 0) {
    return <LoadingScreen />;
  }

  const hasLines = sellerLines.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>AdsGuard</Text>
        <Text style={styles.heroTitle}>My Lines</Text>
        <Text style={styles.heroSubtitle}>
          Track seller entries you expect in your domain ads files.
        </Text>

        {hasLines && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statTotal]}>
              <Text style={[styles.statNumber, styles.statTotalText]}>{stats.total}</Text>
              <Text style={[styles.statLabel, styles.statTotalText]}>Total</Text>
            </View>
            <View style={[styles.statCard, styles.statFound]}>
              <Text style={[styles.statNumber, styles.statFoundText]}>{stats.found}</Text>
              <Text style={[styles.statLabel, styles.statFoundText]}>Found</Text>
            </View>
            <View style={[styles.statCard, styles.statMissing]}>
              <Text style={[styles.statNumber, styles.statMissingText]}>{stats.missing}</Text>
              <Text style={[styles.statLabel, styles.statMissingText]}>Issues</Text>
            </View>
          </View>
        )}
      </View>

      {hasLines && (
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Tracked lines</Text>
          <TouchableOpacity
            style={styles.addLinkBtn}
            onPress={() => navigation.navigate('AddSellerLine')}
          >
            <Ionicons name="add-circle" size={18} color={colors.primary} />
            <Text style={styles.addLink}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={sellerLines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="list-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No tracked lines yet</Text>
            <Text style={styles.emptyText}>
              {domains.length === 0
                ? 'Add a domain on the Dashboard first, then come back to track seller lines.'
                : 'Track lines you expect to appear in ads.txt or app-ads.txt for your domains.'}
            </Text>

            {domains.length > 0 && (
              <>
                <View style={styles.exampleCard}>
                  <Text style={styles.exampleLabel}>Example line</Text>
                  <Text style={styles.exampleLine}>bidscube.com, 123, RESELLER</Text>
                  <Text style={styles.exampleHint}>
                    Checked against the files you selected for each domain.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('AddSellerLine')}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>Add your first line</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { borderLeftColor: statusAccentColor(item.lastStatus) },
            ]}
            onLongPress={() => handleDelete(item)}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <View style={styles.domainRow}>
                <View style={styles.domainIcon}>
                  <Ionicons name="globe-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.domainBody}>
                  <Text style={styles.domainName}>{domainName(item.domainId)}</Text>
                  <Text style={styles.domainFiles}>{domainFilesLabel(item.domainId)}</Text>
                </View>
              </View>
              <StatusBadge status={lineStatusToCheckStatus(item.lastStatus)} size="sm" />
            </View>

            <View style={styles.lineBox}>
              <Text style={styles.lineText}>{formatSellerLine(item)}</Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Ionicons
                  name={item.matchMode === 'exact' ? 'checkmark-done' : 'remove-outline'}
                  size={12}
                  color={colors.textMuted}
                />
                <Text style={styles.metaText}>
                  {item.matchMode === 'exact' ? 'Exact' : 'Partial'}
                </Text>
              </View>
              <View style={styles.metaPill}>
                <Text style={styles.metaText}>{lineStatusLabel(item.lastStatus)}</Text>
              </View>
              <Text style={styles.longPressHint}>Long press to remove</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {domains.length > 0 && hasLines && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddSellerLine')}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  statTotal: {
    backgroundColor: colors.primaryLight,
    borderColor: '#BFDBFE',
  },
  statFound: {
    backgroundColor: colors.successLight,
    borderColor: '#A7F3D0',
  },
  statMissing: {
    backgroundColor: colors.warningLight,
    borderColor: '#FDE68A',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statTotalText: { color: colors.primary },
  statFoundText: { color: colors.success },
  statMissingText: { color: colors.warning },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  addLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addLink: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 90,
    flexGrow: 1,
  },
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
  domainName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  domainFiles: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  lineBox: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  lineText: {
    fontSize: 13,
    color: colors.text,
    fontFamily: 'Menlo',
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
  longPressHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  exampleCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  exampleLine: {
    fontSize: 14,
    fontFamily: 'Menlo',
    color: colors.text,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  exampleHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 10,
    lineHeight: 17,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
