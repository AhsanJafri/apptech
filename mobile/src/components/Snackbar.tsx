import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarContextValue {
  showSnackbar: (message: string, type?: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const TYPE_STYLES: Record<
  SnackbarType,
  { backgroundColor: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  success: { backgroundColor: '#065F46', icon: 'checkmark-circle' },
  error: { backgroundColor: '#B91C1C', icon: 'alert-circle' },
  info: { backgroundColor: '#1E3A8A', icon: 'information-circle' },
};

function SnackbarView({
  message,
  type,
  onHidden,
}: {
  message: string;
  type: SnackbarType;
  onHidden: () => void;
}) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const config = TYPE_STYLES[type];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 12, duration: 180, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) onHidden();
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, [message, onHidden, opacity, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          bottom: Math.max(insets.bottom, 16) + 8,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={[styles.bar, { backgroundColor: config.backgroundColor }]}>
        <Ionicons name={config.icon} size={20} color="#fff" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<{ message: string; type: SnackbarType } | null>(null);

  const showSnackbar = useCallback((message: string, type: SnackbarType = 'info') => {
    setPayload({ message, type });
  }, []);

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {payload ? (
        <SnackbarView
          key={`${payload.message}-${payload.type}`}
          message={payload.message}
          type={payload.type}
          onHidden={() => setPayload(null)}
        />
      ) : null}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
