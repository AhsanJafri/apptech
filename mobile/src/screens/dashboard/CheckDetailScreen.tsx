import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAppSelector } from '@/app/hooks';
import { StatusBadge } from '@/components/StatusBadge';
import { MainStackParamList } from '@/navigation/types';
import { CheckIssue, FileCheckResult } from '@/types';
import { colors } from '@/theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'CheckDetail'>;
  route: RouteProp<MainStackParamList, 'CheckDetail'>;
};

function issueStyle(issue: CheckIssue) {
  if (issue.type === 'fetch_error' || issue.type === 'missing_file') {
    return { box: styles.issueBoxError, text: styles.issueTextError, label: 'Error' };
  }
  return { box: styles.issueBoxWarning, text: styles.issueTextWarning, label: 'Warning' };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function FileDetailSection({ file }: { file: FileCheckResult }) {
  const ownerDomains =
    file.ownerDomains?.length
      ? file.ownerDomains
      : file.ownerDomain
        ? [file.ownerDomain]
        : [];
  const managerDomains = file.managerDomains ?? [];

  return (
    <View style={styles.fileSection}>
      <View style={styles.fileHeader}>
        <Text style={styles.fileTitle}>{file.fileType}</Text>
        <StatusBadge status={file.status} size="sm" />
      </View>

      <DetailRow label="File URL" value={file.fileUrl} />
      <DetailRow label="File found" value={file.fileExists ? 'Yes' : 'No'} />
      <DetailRow label="Seller count" value={String(file.sellerCount)} />
      {file.contentHash && <DetailRow label="Content hash" value={file.contentHash} />}

      {ownerDomains.length > 0 && (
        <View style={styles.listBlock}>
          <Text style={styles.listTitle}>Owner domains</Text>
          {ownerDomains.map((d) => (
            <Text key={d} style={styles.listItem}>
              {d}
            </Text>
          ))}
        </View>
      )}

      {managerDomains.length > 0 && (
        <View style={styles.listBlock}>
          <Text style={styles.listTitle}>Manager domains</Text>
          {managerDomains.map((d) => (
            <Text key={d} style={styles.listItem}>
              {d}
            </Text>
          ))}
        </View>
      )}

      {file.variables && file.variables.length > 0 && (
        <View style={styles.listBlock}>
          <Text style={styles.listTitle}>Variables</Text>
          {file.variables.map((v) => (
            <Text key={`${v.name}-${v.value}`} style={styles.listItem}>
              {v.name}={v.value}
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.issuesTitle}>
        Issues ({file.issues.length})
      </Text>
      {file.issues.length === 0 ? (
        <Text style={styles.noIssues}>No issues found for this file.</Text>
      ) : (
        file.issues.map((issue, index) => {
          const styled = issueStyle(issue);
          return (
            <View key={`${issue.message}-${index}`} style={styled.box}>
              <View style={styles.issueHeader}>
                <Text style={styles.issueIndex}>#{index + 1}</Text>
                <Text style={styles.issueType}>{styled.label}</Text>
                {issue.line != null && (
                  <Text style={styles.issueLine}>Line {issue.line}</Text>
                )}
              </View>
              <Text style={styled.text}>{issue.message}</Text>
            </View>
          );
        })
      )}
    </View>
  );
}

export function CheckDetailScreen({ route }: Props) {
  const { domainId, checkId, fileType } = route.params;
  const domain = useAppSelector((s) => s.domains.items.find((d) => d.id === domainId));
  const checks = useAppSelector((s) => s.checks.byDomainId[domainId] ?? []);
  const check = useMemo(() => checks.find((c) => c.id === checkId), [checks, checkId]);

  const files = useMemo(() => {
    if (!check) return [];
    const all =
      check.files?.length > 0
        ? check.files
        : [
            {
              fileType: 'ads.txt' as const,
              status: check.status,
              fileExists: check.fileExists,
              fileUrl: check.fileUrl,
              sellerCount: check.sellerCount,
              sellers: check.sellers,
              issues: check.issues,
              contentHash: check.contentHash,
            },
          ];
    return fileType ? all.filter((f) => f.fileType === fileType) : all;
  }, [check, fileType]);

  if (!domain || !check) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Check details not found</Text>
      </View>
    );
  }

  const checkedAt = new Date(check.checkedAt).toLocaleString();
  const totalIssues = files.reduce((sum, f) => sum + f.issues.length, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.appName}>{domain.name}</Text>
        <Text style={styles.identifier}>{domain.identifier}</Text>
        {domain.hostDomain && (
          <Text style={styles.hostDomain}>Host: {domain.hostDomain}</Text>
        )}
        <View style={styles.heroMeta}>
          <StatusBadge status={check.status} />
          <Text style={styles.checkedAt}>{checkedAt}</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Check summary</Text>
        <DetailRow label="Overall status" value={check.status} />
        <DetailRow label="Total sellers" value={String(check.sellerCount)} />
        <DetailRow label="Total issues" value={String(totalIssues)} />
        {check.contentHash && <DetailRow label="Combined hash" value={check.contentHash} />}
        {domain.developerUrl && (
          <DetailRow label="Developer site" value={domain.developerUrl} />
        )}
      </View>

      {files.map((file) => (
        <FileDetailSection key={file.fileType} file={file} />
      ))}

      {totalIssues >= 50 && (
        <Text style={styles.truncationNote}>
          Up to 50 issues are stored per check. Re-run a check after fixing lines to see updated
          results.
        </Text>
      )}
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
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  identifier: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  hostDomain: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 10,
  },
  heroMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkedAt: {
    fontSize: 12,
    color: colors.textMuted,
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
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  fileSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  fileTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  listBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  listItem: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  issuesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 10,
  },
  noIssues: {
    fontSize: 14,
    color: colors.success,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  issueIndex: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  issueType: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  issueLine: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  issueBoxError: {
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  issueBoxWarning: {
    backgroundColor: colors.warningLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  issueTextError: {
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
  },
  issueTextWarning: {
    fontSize: 14,
    color: '#B45309',
    lineHeight: 20,
  },
  truncationNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
