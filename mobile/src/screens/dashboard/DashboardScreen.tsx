import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDomains, loadDomainsOffline } from '@/features/domains/domainsSlice';
import { DomainCard } from '@/components/DomainCard';
import { InspireBanner } from '@/components/InspireBanner';
import { LoadingScreen } from '@/components/LoadingScreen';
import { MainStackParamList, MainTabParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';

type DashboardNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'DashboardTab'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type Props = {
  navigation: DashboardNavigation;
};

export function DashboardScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { items: domains, isLoading } = useAppSelector((s) => s.domains);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    await dispatch(loadDomainsOffline(user.id));
    await dispatch(fetchDomains(user.id));
  }, [dispatch, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const healthyCount = domains.filter((d) => d.status === 'healthy').length;
  const warningCount = domains.filter((d) => d.status === 'warning').length;
  const errorCount = domains.filter((d) => d.status === 'error').length;
  const hasDomains = domains.length > 0;

  if (isLoading && domains.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>AdsGuard</Text>
        <Text style={styles.heroTitle}>Dashboard</Text>
        <Text style={styles.heroSubtitle}>
          {hasDomains
            ? `Monitoring ${domains.length} domain${domains.length === 1 ? '' : 's'} for ads.txt and app-ads.txt issues.`
            : 'Add domains to monitor ads.txt and app-ads.txt health.'}
        </Text>

        {hasDomains && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statHealthy]}>
              <Text style={[styles.statNumber, styles.statHealthyText]}>{healthyCount}</Text>
              <Text style={[styles.statLabel, styles.statHealthyText]}>Healthy</Text>
            </View>
            <View style={[styles.statCard, styles.statWarning]}>
              <Text style={[styles.statNumber, styles.statWarningText]}>{warningCount}</Text>
              <Text style={[styles.statLabel, styles.statWarningText]}>Warnings</Text>
            </View>
            <View style={[styles.statCard, styles.statError]}>
              <Text style={[styles.statNumber, styles.statErrorText]}>{errorCount}</Text>
              <Text style={[styles.statLabel, styles.statErrorText]}>Failing</Text>
            </View>
          </View>
        )}
      </View>

      {hasDomains && (
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Your domains</Text>
        </View>
      )}

      <FlatList
        data={domains}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DomainCard
            domain={item}
            onPress={() => navigation.navigate('DomainDetail', { domainId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No domains yet</Text>
            <Text style={styles.emptyText}>
              Start monitoring your websites and apps. AdsGuard checks ads.txt and app-ads.txt on
              a schedule and alerts you when something breaks.
            </Text>
            <InspireBanner showVideo />
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddDomain')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Add your first domain</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {hasDomains && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddDomain')}
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
  statHealthy: {
    backgroundColor: colors.successLight,
    borderColor: '#A7F3D0',
  },
  statWarning: {
    backgroundColor: colors.warningLight,
    borderColor: '#FDE68A',
  },
  statError: {
    backgroundColor: colors.errorLight,
    borderColor: '#FECACA',
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
  statHealthyText: {
    color: colors.success,
  },
  statWarningText: {
    color: colors.warning,
  },
  statErrorText: {
    color: colors.error,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 90,
    flexGrow: 1,
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
    marginBottom: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
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
