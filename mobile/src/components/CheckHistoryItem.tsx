import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckResult } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/theme/colors';

interface CheckHistoryItemProps {
  check: CheckResult;
}

export function CheckHistoryItem({ check }: CheckHistoryItemProps) {
  const checkedAt = new Date(check.checkedAt).toLocaleString();
  const files = check.files?.length
    ? check.files
    : [
        {
          fileType: 'ads.txt' as const,
          status: check.status,
          fileExists: check.fileExists,
          sellerCount: check.sellerCount,
        },
      ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <StatusBadge status={check.status} size="sm" />
        <Text style={styles.date}>{checkedAt}</Text>
      </View>

      {files.map((file) => (
        <View key={file.fileType} style={styles.fileRow}>
          <Text style={styles.fileName}>{file.fileType}</Text>
          <Text style={styles.fileMeta}>
            {file.fileExists ? `${file.sellerCount} sellers` : 'Missing'}
          </Text>
        </View>
      ))}

      {check.issues[0] && (
        <Text style={styles.issue} numberOfLines={3}>
          {check.issues[0].message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  fileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  fileMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  issue: {
    marginTop: 8,
    fontSize: 13,
    color: colors.error,
    lineHeight: 18,
  },
});
