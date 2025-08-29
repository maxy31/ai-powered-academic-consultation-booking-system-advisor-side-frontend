import { enableScreens } from 'react-native-screens';

enableScreens();

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Announcement"
      screenOptions={{
        headerStyle: { backgroundColor: '#8C8CFF' },
        headerTitleStyle: { color: '#fff', fontWeight: 'bold', fontSize: 22 },
        headerTitleAlign: 'left',
      }}
    >
      <Tab.Screen name="Announcement" component={AnnouncementScreen} />
      <Tab.Screen name="SAppointment" component={StudentScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="EditAnnouncement" component={EditAnnouncementScreen} />
  <Stack.Screen name="UploadTimetable" component={UploadTimetableScreen} />
  <Stack.Screen name="CreateAnnouncement" component={CreateAnnouncementScreen} />
  <Stack.Screen name="Suggestion" component={SuggestionScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
  <Stack.Screen name="Search" component={SearchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;