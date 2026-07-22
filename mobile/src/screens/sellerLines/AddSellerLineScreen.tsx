import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addSellerLine } from '@/features/sellerLines/sellerLinesSlice';
import { runManualCheck } from '@/features/checks/checksSlice';
import { MonitoredDomain, TrackedLineMatchMode } from '@/types';
import {
  parseSellerLineInput,
  sellerLineHint,
  sellerLinePlaceholder,
} from '@/utils/sellerLine';
import { useSnackbar } from '@/components/Snackbar';
import { MainStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'AddSellerLine'>;
};

function monitoredFilesLabel(domain: MonitoredDomain): string {
  const files =
    domain.monitoredFiles?.length > 0
      ? domain.monitoredFiles
      : domain.type === 'app'
        ? ['app-ads.txt']
        : ['ads.txt', 'app-ads.txt'];
  return files.join(' · ');
}

function DomainPicker({
  domains,
  selectedDomainId,
  onSelect,
}: {
  domains: MonitoredDomain[];
  selectedDomainId: string;
  onSelect: (domainId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedDomain = domains.find((domain) => domain.id === selectedDomainId);

  const filteredDomains = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return domains;
    return domains.filter(
      (domain) =>
        domain.name.toLowerCase().includes(term) ||
        domain.identifier.toLowerCase().includes(term) ||
        domain.hostDomain?.toLowerCase().includes(term)
    );
  }, [domains, query]);

  const handleSelect = (domainId: string) => {
    onSelect(domainId);
    setOpen(false);
    setQuery('');
    Keyboard.dismiss();
  };

  return (
    <View style={pickerStyles.wrap}>
      <TouchableOpacity
        style={[pickerStyles.field, open && pickerStyles.fieldOpen]}
        onPress={() => setOpen((value) => !value)}
        activeOpacity={0.85}
      >
        <View style={pickerStyles.fieldIcon}>
          <Ionicons name="globe-outline" size={18} color={colors.primary} />
        </View>
        <View style={pickerStyles.fieldBody}>
          <Text style={pickerStyles.fieldLabel}>Selected domain</Text>
          <Text style={pickerStyles.fieldValue} numberOfLines={1}>
            {selectedDomain?.name ?? 'Choose a domain'}
          </Text>
          {selectedDomain ? (
            <Text style={pickerStyles.fieldMeta} numberOfLines={1}>
              {selectedDomain.identifier}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {open && (
        <View style={pickerStyles.dropdown}>
          <View style={pickerStyles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={pickerStyles.searchInput}
              placeholder="Search domains..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={pickerStyles.list} keyboardShouldPersistTaps="handled">
            {filteredDomains.length === 0 ? (
              <Text style={pickerStyles.empty}>No domains match your search.</Text>
            ) : (
              filteredDomains.map((domain) => {
                const active = domain.id === selectedDomainId;
                return (
                  <TouchableOpacity
                    key={domain.id}
                    style={[pickerStyles.option, active && pickerStyles.optionActive]}
                    onPress={() => handleSelect(domain.id)}
                  >
                    <View style={pickerStyles.optionBody}>
                      <Text style={[pickerStyles.optionTitle, active && pickerStyles.optionTitleActive]}>
                        {domain.name}
                      </Text>
                      <Text style={pickerStyles.optionSubtitle} numberOfLines={1}>
                        {domain.identifier}
                      </Text>
                      <Text style={pickerStyles.optionFiles}>{monitoredFilesLabel(domain)}</Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export function AddSellerLineScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const { user } = useAppSelector((s) => s.auth);
  const { items: domains } = useAppSelector((s) => s.domains);
  const [selectedDomainId, setSelectedDomainId] = useState(domains[0]?.id ?? '');
  const [lineInput, setLineInput] = useState('');
  const [matchMode, setMatchMode] = useState<TrackedLineMatchMode>('exact');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;

    if (!selectedDomainId) {
      showSnackbar('Select one of your monitored domains first.', 'error');
      return;
    }

    const parsed = parseSellerLineInput(lineInput, matchMode);
    if (!parsed) {
      showSnackbar(
        matchMode === 'partial'
          ? 'Enter a domain like bidscube.com, or domain + ID like bidscube.com, 123'
          : 'Enter a full line like bidscube.com, 123, RESELLER',
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    const result = await dispatch(
      addSellerLine({
        userId: user.id,
        domainId: selectedDomainId,
        sellerDomain: parsed.sellerDomain,
        publisherId: parsed.publisherId,
        relationship: parsed.relationship,
        matchMode,
      })
    );
    setIsSubmitting(false);

    if (addSellerLine.fulfilled.match(result)) {
      const domain = domains.find((item) => item.id === selectedDomainId);
      if (domain) {
        await dispatch(runManualCheck({ userId: user.id, domain }));
      }
      showSnackbar('Seller line tracked and checked', 'success');
      navigation.goBack();
    } else {
      showSnackbar('Could not save seller line. Please try again.', 'error');
    }
  };

  if (domains.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Add a domain on the Dashboard before tracking seller lines.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.introCard}>
        <Text style={styles.introTitle}>Track a seller line</Text>
        <Text style={styles.introText}>
          We will check this line in the ads files already selected for your domain.
        </Text>
      </View>

      <Text style={styles.label}>Domain</Text>
      <DomainPicker
        domains={domains}
        selectedDomainId={selectedDomainId}
        onSelect={setSelectedDomainId}
      />

      <Text style={styles.label}>Seller line</Text>
      <TextInput
        style={styles.input}
        placeholder={sellerLinePlaceholder(matchMode)}
        placeholderTextColor={colors.textMuted}
        value={lineInput}
        onChangeText={setLineInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.hint}>{sellerLineHint(matchMode)}</Text>

      <Text style={styles.label}>Match mode</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.choice, matchMode === 'exact' && styles.choiceActive]}
          onPress={() => setMatchMode('exact')}
        >
          <Text style={[styles.choiceText, matchMode === 'exact' && styles.choiceTextActive]}>
            Exact
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.choice, matchMode === 'partial' && styles.choiceActive]}
          onPress={() => setMatchMode('partial')}
        >
          <Text style={[styles.choiceText, matchMode === 'partial' && styles.choiceTextActive]}>
            Partial
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        Exact checks domain, publisher ID, and DIRECT/RESELLER. Partial matches by domain only, or domain + publisher ID.
      </Text>

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Saving & checking...' : 'Track Line'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const pickerStyles = StyleSheet.create({
  wrap: {
    zIndex: 10,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  fieldOpen: {
    borderColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBody: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  fieldMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.primary,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
    maxHeight: 280,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  list: {
    maxHeight: 210,
  },
  empty: {
    padding: 16,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  optionActive: {
    backgroundColor: colors.primaryLight,
  },
  optionBody: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  optionTitleActive: {
    color: colors.primary,
  },
  optionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionFiles: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  introTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  choice: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  choiceActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  choiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  choiceTextActive: {
    color: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
