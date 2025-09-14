import { enableScreens } from 'react-native-screens';

enableScreens();

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef, flushPendingNavigation } from './src/navigation/navigationRef';
import AppointmentDetailScreen from './src/screens/AppointmentDetailScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore optional import (not required for web)
import notifee from '@notifee/react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import StudentScreen from './src/screens/StudentScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import UploadTimetableScreen from './src/screens/UploadTimetableScreen';
import SuggestionScreen from './src/screens/SuggestionScreen';
import AnnouncementScreen from './src/screens/AnnouncementScreen';
import EditAnnouncementScreen from './src/screens/EditAnnouncementScreen';
import CreateAnnouncementScreen from './src/screens/CreateAnnouncementScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import { NotificationsProvider, useNotifications } from './src/context/NotificationsContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const NotificationBell = ({ navigation }: any) => {
  const { unreadCount } = useNotifications();
  return (
    <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
      <Ionicons name="notifications-outline" size={24} color="#fff" />
      {unreadCount > 0 && (
        <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>
      )}
    </TouchableOpacity>
  );
};

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Announcement"
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: '#8C8CFF' },
        headerTitleStyle: { color: '#fff', fontWeight: 'bold', fontSize: 22 },
        headerTitleAlign: 'left',
        headerRight: () => <NotificationBell navigation={navigation} />,
      })}
    >
      <Tab.Screen name="Announcement" component={AnnouncementScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="megaphone-outline" color={color} size={size} /> }} />
      <Tab.Screen name="Appointment" component={StudentScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="people-circle-outline" color={color} size={size} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

const RootNavigator = () => {
  const { token, loading } = useAuth();
  return (
    <NavigationContainer
        ref={navigationRef}
        onReady={async () => {
          flushPendingNavigation();
          try {
            // Handle app opened from a notification (cold start)
            if (notifee?.getInitialNotification) {
              const initial = await notifee.getInitialNotification();
              if (initial?.notification?.data) {
                handleNotificationNavigation(initial.notification.data);
              }
            }
            // Handle any queued background tap stored earlier
            const queued = await AsyncStorage.getItem('pendingTapData');
            if (queued) {
              await AsyncStorage.removeItem('pendingTapData');
              const data = JSON.parse(queued);
              handleNotificationNavigation(data);
            }
          } catch (e) { console.log('[App] initial notification navigation error', e); }
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {loading ? (
            <Stack.Screen name="Splash" component={() => <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text>Loading...</Text></View>} />
          ) : token ? (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="EditAnnouncement" component={EditAnnouncementScreen} />
              <Stack.Screen name="UploadTimetable" component={UploadTimetableScreen} />
              <Stack.Screen name="CreateAnnouncement" component={CreateAnnouncementScreen} />
              <Stack.Screen name="Suggestion" component={SuggestionScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="Search" component={SearchScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, title: 'Notifications', headerStyle: { backgroundColor: '#8C8CFF' }, headerTintColor: '#fff' }} />
              <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ headerShown: true, title: 'Appointment Detail', headerStyle: { backgroundColor: '#8C8CFF' }, headerTintColor: '#fff' }} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
  );
};

const App = () => (
  <AuthProvider>
    <NotificationsProvider>
      <RootNavigator />
    </NotificationsProvider>
  </AuthProvider>
);

const styles = StyleSheet.create({
  bellBtn: { marginRight: 14, padding: 4 },
  badge: {
    position: 'absolute', top: -2, right: -2, backgroundColor: '#FF4D4F', minWidth: 18, height: 18,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});

export default App;

// Simple route decision based on data received
function handleNotificationNavigation(data: any) {
  try {
    if (data?.relatedAppointmentId) {
      if (navigationRef.isReady()) {
        (navigationRef as any).navigate('AppointmentDetail', { appointmentId: Number(data.relatedAppointmentId) });
      } else {
        (navigationRef as any).navigate('Notifications');
      }
      return;
    }
    navigationRef.isReady() && (navigationRef as any).navigate('Notifications');
  } catch (e) { console.log('[App] handleNotificationNavigation error', e); }
}

