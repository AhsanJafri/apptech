import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addDomain } from '@/features/domains/domainsSlice';
import { AdsFileKind, DomainType } from '@/types';
import { isValidDomain, isValidAppPackage, normalizeDomain } from '@/utils/validation';
import { MainStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'AddDomain'>;
};

export function AddDomainScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { items: domains } = useAppSelector((s) => s.domains);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [type, setType] = useState<DomainType>('website');
  const [monitorAdsTxt, setMonitorAdsTxt] = useState(true);
  const [monitorAppAdsTxt, setMonitorAppAdsTxt] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const setDomainType = (next: DomainType) => {
    setType(next);
    if (next === 'app') {
      setMonitorAdsTxt(false);
      setMonitorAppAdsTxt(true);
    } else {
      setMonitorAdsTxt(true);
      setMonitorAppAdsTxt(true);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    const normalizedId =
      type === 'website' ? normalizeDomain(identifier) : identifier.trim().toLowerCase();

    if (type === 'website' && !isValidDomain(normalizedId)) {
      Alert.alert('Error', 'Please enter a valid domain (e.g. example.com)');
      return;
    }

    if (type === 'app' && !isValidAppPackage(normalizedId)) {
      Alert.alert('Error', 'Please enter a valid app package (e.g. com.example.app)');
      return;
    }

    const monitoredFiles: AdsFileKind[] = [];
    if (type === 'website' && monitorAdsTxt) monitoredFiles.push('ads.txt');
    if (monitorAppAdsTxt) monitoredFiles.push('app-ads.txt');

    if (monitoredFiles.length === 0) {
      Alert.alert('Error', 'Select at least one file to monitor (ads.txt or app-ads.txt).');
      return;
    }

    if (domains.length >= (user.domainLimit ?? 1)) {
      Alert.alert(
        'Limit Reached',
        `Your plan allows ${user.domainLimit} domain(s). Upgrade to add more.`
      );
      return;
    }

    setIsSubmitting(true);
    if (type === 'app') {
      setIsResolving(true);
    }
    const result = await dispatch(
      addDomain({
        userId: user.id,
        name: name.trim(),
        identifier: normalizedId,
        type,
        monitoredFiles,
      })
    );
    setIsResolving(false);
    setIsSubmitting(false);

    if (addDomain.fulfilled.match(result)) {
      navigation.goBack();
    } else {
      Alert.alert(
        'Error',
        typeof result.payload === 'string'
          ? result.payload
          : result.error.message ?? 'Failed to add domain. Please try again.'
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeButton, type === 'website' && styles.typeButtonActive]}
          onPress={() => setDomainType('website')}
        >
          <Text style={[styles.typeButtonText, type === 'website' && styles.typeButtonTextActive]}>
            Website
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, type === 'app' && styles.typeButtonActive]}
          onPress={() => setDomainType('app')}
        >
          <Text style={[styles.typeButtonText, type === 'app' && styles.typeButtonTextActive]}>
            Google Play App
          </Text>
        </TouchableOpacity>
      </View>

      {type === 'app' && (
        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Google Play apps only</Text>
          <Text style={styles.noteText}>
            Enter the Play Store package ID (e.g. com.example.app). We look up the developer
            website from the Play listing and check app-ads.txt on that domain.
          </Text>
        </View>
      )}

      <Text style={styles.label}>Display Name</Text>
      <TextInput
        style={styles.input}
        placeholder="My Blog"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>
        {type === 'website' ? 'Domain' : 'Google Play Package ID'}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={type === 'website' ? 'example.com' : 'com.example.myapp'}
        placeholderTextColor={colors.textMuted}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Files to monitor</Text>
      <View style={styles.checkboxGroup}>
        {type === 'website' && (
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setMonitorAdsTxt((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, monitorAdsTxt && styles.checkboxChecked]}>
              {monitorAdsTxt && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.checkboxTextWrap}>
              <Text style={styles.checkboxTitle}>ads.txt</Text>
              <Text style={styles.checkboxHint}>Website authorized sellers file</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setMonitorAppAdsTxt((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, monitorAppAdsTxt && styles.checkboxChecked]}>
            {monitorAppAdsTxt && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.checkboxTextWrap}>
            <Text style={styles.checkboxTitle}>app-ads.txt</Text>
            <Text style={styles.checkboxHint}>App authorized sellers file</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        Only selected files will be checked and saved to your account.
      </Text>

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isResolving
            ? 'Looking up developer website...'
            : isSubmitting
              ? 'Saving...'
              : 'Start Monitoring'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: colors.primary,
  },
  noteBox: {
    marginTop: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  checkboxGroup: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxTextWrap: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  checkboxHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 18,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
