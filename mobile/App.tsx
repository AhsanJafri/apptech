import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@/app/store';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setUser } from '@/features/auth/authSlice';
import { onAuthChange } from '@/services/firebase/auth';
import { registerForPushNotifications } from '@/services/notifications/push';
import { AuthNavigator, AppNavigator } from '@/navigation/RootNavigator';
import { LoadingScreen } from '@/components/LoadingScreen';
import { SnackbarProvider } from '@/components/Snackbar';
import { RootStackParamList } from '@/navigation/types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    const unsubscribe = onAuthChange((nextUser) => {
      dispatch(setUser(nextUser));
    });
    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    if (user?.id) {
      void registerForPushNotifications(user.id);
    }
  }, [user?.id]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name="Main" component={AppNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <SnackbarProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="dark" />
        </SnackbarProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
