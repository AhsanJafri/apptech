import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { saveExpoPushToken } from '@/services/firebase/auth';

const PUSH_NATIVE_MODULES = [
  'ExpoDevice',
  'ExpoPushTokenManager',
  'ExpoNotificationPermissionsModule',
] as const;

function pushNotificationsSupported(): boolean {
  return PUSH_NATIVE_MODULES.every(
    (name) => requireOptionalNativeModule(name) != null
  );
}

let notificationHandlerConfigured = false;

async function configureNotificationHandler(): Promise<boolean> {
  if (notificationHandlerConfigured) return true;
  if (!pushNotificationsSupported()) return false;

  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
    return true;
  } catch {
    return false;
  }
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!pushNotificationsSupported()) {
    if (__DEV__) {
      console.log(
        'Push notifications skipped — rebuild the dev client: npx expo run:ios'
      );
    }
    return null;
  }

  try {
    const ready = await configureNotificationHandler();
    if (!ready) return null;

    const Device = await import('expo-device');
    const Notifications = await import('expo-notifications');

    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResponse.data;

    await saveExpoPushToken(userId, token);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('adsguard-alerts', {
        name: 'Domain failure alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    return token;
  } catch (error) {
    console.warn('Push registration failed:', error);
    return null;
  }
}
