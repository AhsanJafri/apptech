import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileCheckResult } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/theme/colors';

const PREVIEW_ISSUE_COUNT = 2;

interface FileCheckCardProps {
  file: FileCheckResult;
  onShowMore?: () => void;
}

function DomainList({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <View style={styles.domainBlock}>
      <Text style={styles.domainLabel}>{label}</Text>
      {values.map((value) => (
        <Text key={`${label}-${value}`} style={styles.domainValue}>
          {value}
        </Text>
      ))}
    </View>
  );
}

export function FileCheckCard({ file, onShowMore }: FileCheckCardProps) {
  const ownerDomains =
    file.ownerDomains?.length
      ? file.ownerDomains
      : file.ownerDomain
        ? [file.ownerDomain]
        : [];
  const managerDomains = file.managerDomains ?? [];
  const previewIssues = file.issues.slice(0, PREVIEW_ISSUE_COUNT);
  const hiddenCount = file.issues.length - previewIssues.length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.fileName}>{file.fileType}</Text>
        <StatusBadge status={file.status} size="sm" />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{file.fileExists ? 'Found' : 'Missing'}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Sellers</Text>
        <Text style={styles.value}>{file.sellerCount}</Text>
      </View>

      <DomainList label="Owner domains" values={ownerDomains} />
      <DomainList label="Manager domains" values={managerDomains} />

      {file.issues.length > 0 ? (
        <View style={styles.issues}>
          {previewIssues.map((issue, index) => (
            <View key={`${file.fileType}-${index}`} style={styles.issueBox}>
              <Text style={styles.issueText}>{issue.message}</Text>
            </View>
          ))}
          {hiddenCount > 0 && onShowMore && (
            <TouchableOpacity style={styles.showMoreButton} onPress={onShowMore}>
              <Text style={styles.showMoreText}>Show more ({file.issues.length} issues)</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Text style={styles.okText}>No issues found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.divider,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  domainBlock: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  domainLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  domainValue: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 2,
  },
  issues: {
    marginTop: 10,
    gap: 8,
  },
  issueBox: {
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  issueText: {
    fontSize: 13,
    color: colors.error,
    lineHeight: 18,
  },
  showMoreButton: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  okText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.success,
  },
});
