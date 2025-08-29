import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';

type RootStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Login: undefined;
  UploadTimetable: undefined;
};

const ProfileScreen = () => {
  const [profile, setProfile] = useState<{
    advisorName: string;
    username: string;
    email: string;
    phoneNumber: string;
    department: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem('jwtToken');
          const res = await fetch('http://10.0.2.2:8080/api/profile/getProfileAdvisor', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!res.ok) throw new Error('Failed to fetch profile');
          const data = await res.json();
          if (isActive) setProfile(data);
        } catch (err) {
          Alert.alert('Error', 'Could not fetch profile');
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchProfile();
      return () => { isActive = false; };
    }, [])
  );

  // Logout handler with confirmation
  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              await fetch('http://10.0.2.2:8080/api/profile/logout', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              await AsyncStorage.removeItem('jwtToken');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (err) {
              Alert.alert('Error', 'Logout failed');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.firstInfo}>
              {loading ? <ActivityIndicator color="#fff" /> : profile?.advisorName || 'Advisor Name'}
            </Text>
            <Text style={styles.secondInfo}>
              {loading ? '' : profile?.username || 'Advisor ID'}
            </Text>
            <Text style={styles.secondInfo}>
              {loading ? '' : profile?.department || 'Department'}
            </Text>
          </View>
          <Image
            source={{ uri: 'https://via.placeholder.com/80' }}
            style={styles.profileImage}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.bookingSection}>
          <Text style={styles.bookingTitle}>Booking:</Text>
          <Text style={styles.bookingText}>Date: xx-xx-20xx</Text>
          <Text style={styles.bookingText}>Time: xx:xx::xx</Text>
        </View>
      </View>
      <ActionButton text="Upload Timetable" onPress={() => navigation.navigate('UploadTimetable')} />
      <ActionButton text="Consultation History" onPress={() => {}} />
      <ActionButton text="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
      <ActionButton text="Log Out" onPress={handleLogout} />
    </ScrollView>
  );
};

// Reusable ActionButton component
const ActionButton = ({ text, onPress }: { text: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Text style={styles.actionButtonText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 1,
  },
  profileCard: {
    width: '90%',
    backgroundColor: '#8C8CFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  firstInfo: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 2,
  },
  secondInfo: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginLeft: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#fff',
    marginVertical: 8,
    opacity: 0.5,
  },
  bookingSection: {
    marginLeft: 4,
  },
  bookingTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  bookingText: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 2,
  },
  actionButton: {
    width: '90%',
    backgroundColor: '#8C8CFF',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
});

export default ProfileScreen;