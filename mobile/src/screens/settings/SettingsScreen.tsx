import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { signOut } from '@/features/auth/authSlice';
import { colors } from '@/theme/colors';

export function SettingsScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => dispatch(signOut()),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Plan</Text>
            <Text style={styles.value}>{user?.plan ?? 'free'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Domain Limit</Text>
            <Text style={styles.value}>{user?.domainLimit ?? 1}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alerts</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Email Alerts</Text>
            <Text style={styles.value}>
              {user?.emailAlertsEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Telegram Alerts</Text>
            <Text style={styles.value}>
              {user?.telegramAlertsEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>
        <Text style={styles.hint}>
          Alert settings will be configurable in a future update. Checks run every 2 hours
          on the server.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <View style={styles.card}>
          <View style={styles.planRow}>
            <Text style={styles.planName}>Starter</Text>
            <Text style={styles.planPrice}>$3.99/mo · 1 domain</Text>
          </View>
          <View style={styles.planRow}>
            <Text style={styles.planName}>Pro</Text>
            <Text style={styles.planPrice}>$9.99/mo · 5 domains</Text>
          </View>
          <View style={styles.planRow}>
            <Text style={styles.planName}>Business</Text>
            <Text style={styles.planPrice}>$24.99/mo · 20 domains</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>AdsGuard v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  label: {
    fontSize: 15,
    color: colors.text,
  },
  value: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    marginHorizontal: 4,
    lineHeight: 18,
  },
  planRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  planName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  planPrice: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: 8,
  },
  signOutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '500',
  },
  version: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 24,
  },
});
