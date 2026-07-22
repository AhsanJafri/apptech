import { Pressable, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { AddDomainScreen } from '@/screens/dashboard/AddDomainScreen';
import { DomainDetailScreen } from '@/screens/dashboard/DomainDetailScreen';
import { CheckDetailScreen } from '@/screens/dashboard/CheckDetailScreen';
import { SellerLinesScreen } from '@/screens/sellerLines/SellerLinesScreen';
import { AddSellerLineScreen } from '@/screens/sellerLines/AddSellerLineScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { AuthStackParamList, MainStackParamList, MainTabParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function HeaderBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        marginLeft: Platform.OS === 'ios' ? 0 : 4,
        paddingHorizontal: 4,
        paddingVertical: 4,
      }}
    >
      <Ionicons name="chevron-back" size={26} color={colors.text} />
    </Pressable>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 58,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SellerLinesTab"
        component={SellerLinesScreen}
        options={{
          title: 'My Lines',
          tabBarLabel: 'My Lines',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackVisible: false,
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <HeaderBackButton onPress={() => navigation.goBack()} />
          ) : undefined,
      })}
    >
      <MainStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="AddDomain"
        component={AddDomainScreen}
        options={{ title: 'Add Domain' }}
      />
      <MainStack.Screen
        name="AddSellerLine"
        component={AddSellerLineScreen}
        options={{ title: 'Track Seller Line' }}
      />
      <MainStack.Screen
        name="DomainDetail"
        component={DomainDetailScreen}
        options={{ title: 'Domain Details' }}
      />
      <MainStack.Screen
        name="CheckDetail"
        component={CheckDetailScreen}
        options={{ title: 'Check Details' }}
      />
    </MainStack.Navigator>
  );
}

export function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

export function AppNavigator() {
  return <MainNavigator />;
}
