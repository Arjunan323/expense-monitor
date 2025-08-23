import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Screens
import { AuthScreen } from '../screens/AuthScreen';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { NotificationPreferencesScreen } from '../screens/NotificationPreferencesScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { StatementsScreen } from '../screens/StatementsScreen';
import { BillingScreen } from '../screens/BillingScreen';
import { AnalyticsFeedbackScreen } from '../screens/AnalyticsFeedbackScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { UploadScreen } from '../screens/UploadScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: keyof typeof Ionicons.glyphMap;
          let iconColor = isFocused ? '#FFFFFF' : '#9CA3AF';
          let backgroundColor = isFocused ? '#00B77D' : 'transparent';

          switch (route.name) {
            case 'Dashboard':
              iconName = 'home';
              break;
            case 'Transactions':
              iconName = 'receipt';
              break;
            case 'Upload':
              iconName = 'cloud-upload';
              backgroundColor = isFocused ? '#FFD60A' : 'transparent';
              iconColor = isFocused ? '#1F2937' : '#9CA3AF';
              break;
            case 'Analytics':
              iconName = 'bar-chart';
              break;
            case 'More':
              iconName = 'grid';
              break;
            default:
              iconName = 'ellipse';
          }

          return (
            <View key={route.key} style={styles.tabItem}>
              <View style={[styles.tabButton, { backgroundColor }]}>
                <Ionicons
                  name={iconName}
                  size={isFocused ? 24 : 20}
                  color={iconColor}
                  onPress={onPress}
                />
              </View>
              {isFocused && (
                <Text style={[styles.tabLabel, { color: iconColor === '#FFFFFF' ? '#00B77D' : '#FFD60A' }]}>
                  {label}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{ title: 'Transactions' }}
      />
      <Tab.Screen 
        name="Upload" 
        component={UploadScreen}
        options={{ title: 'Upload' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen}
        options={{ title: 'More' }}
      />
    </Tab.Navigator>
  );
};

// More Screen with additional options
const MoreScreen = () => {
  const { logout } = useAuth();
  const navigation = useNavigation<any>();

  const menuItems = [
    { title: 'Statements', icon: 'document-text', screen: 'Statements', color: '#0077B6' },
    { title: 'Billing & Plans', icon: 'card', screen: 'Billing', color: '#00B77D' },
    { title: 'Settings', icon: 'settings', screen: 'Settings', color: '#6366F1' },
    { title: 'Sign Out', icon: 'log-out', action: 'logout', color: '#EF4444' },
  ];

  const handleItemPress = (item: any) => {
    if (item.action === 'logout') {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]
      );
    } else {
      navigation.navigate(item.screen);
    }
  };

  return (
    <View style={moreStyles.container}>
      <View style={moreStyles.header}>
        <View style={moreStyles.logoContainer}>
          <Text style={moreStyles.logoEmoji}>✂️</Text>
        </View>
        <Text style={moreStyles.brandName}>CutTheSpend</Text>
        <Text style={moreStyles.tagline}>See it. Cut it. Save more.</Text>
      </View>

      <View style={moreStyles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[moreStyles.menuItem, { borderLeftColor: item.color }]}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
          >
            <View style={[moreStyles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={moreStyles.menuContent}>
              <Text style={moreStyles.menuTitle}>{item.title}</Text>
              {item.screen && (
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={moreStyles.footer}>
        <Text style={moreStyles.footerText}>Version 1.0.0</Text>
        <Text style={moreStyles.footerSubtext}>Made with ❤️ for savers everywhere</Text>
      </View>
    </View>
  );
};

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen 
        name="Statements" 
        component={StatementsScreen}
        options={{
          headerShown: true,
          title: 'Statements',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#00B77D', fontWeight: 'bold' },
          headerTintColor: '#00B77D',
        }}
      />
      <Stack.Screen 
        name="Billing" 
        component={BillingScreen}
        options={{
          headerShown: true,
          title: 'Billing & Plans',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#00B77D', fontWeight: 'bold' },
          headerTintColor: '#00B77D',
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#00B77D', fontWeight: 'bold' },
          headerTintColor: '#00B77D',
        }}
      />
      <Stack.Screen
        name="AnalyticsFeedback"
        component={AnalyticsFeedbackScreen}
        options={{
          headerShown: true,
          title: 'Analytics Feedback',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#00B77D', fontWeight: 'bold' },
          headerTintColor: '#00B77D',
        }}
      />
      <Stack.Screen
        name="NotificationPrefs"
        component={NotificationPreferencesScreen}
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#00B77D', fontWeight: 'bold' },
          headerTintColor: '#00B77D',
        }}
      />
    </Stack.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
  // Removed absolute positioning to prevent overlay hiding screen bottom content
  backgroundColor: 'transparent',
  paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  paddingTop: 8,
  paddingHorizontal: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

const moreStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#00B77D',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#00B77D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00B77D',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  menuContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 4,
  },
});

// Import necessary components
import { TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';