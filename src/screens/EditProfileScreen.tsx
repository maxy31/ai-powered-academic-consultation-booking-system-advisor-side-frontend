import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState({
    username: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    departmentId: null as number | null,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [departments, setDepartments] = useState<Array<{ departmentId: number; departmentName: string }>>([]);
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch('http://10.0.2.2:8080/api/profile/getProfileAdvisor', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile({
          username: data.username || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phoneNumber: data.phoneNumber || '',
          departmentId: (data.departmentId ?? null),
        });
        if (data.department) {
          setSelectedDepartmentName(String(data.department));
        }
      } catch (err) {
        Alert.alert('Error', 'Could not fetch profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    const fetchDepartments = async () => {
      try {
        const res = await fetch('http://10.0.2.2:8080/api/auth/showDepartments');
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data)
            ? data
                .map((d: any) => ({
                  departmentId: Number(d?.departmentId),
                  departmentName: String(d?.departmentName ?? ''),
                }))
                .filter((d: any) => !!d.departmentId && !!d.departmentName)
            : [];
          setDepartments(items);
        }
      } catch {}
    };
    fetchDepartments();
  }, []);

  // Map departmentId to departmentName for display when data arrives
  useEffect(() => {
    if (profile.departmentId && departments.length) {
      const found = departments.find(d => d.departmentId === profile.departmentId);
      if (found) setSelectedDepartmentName(found.departmentName);
    }
  }, [departments, profile.departmentId]);

  const handleUpdate = async () => {
    Alert.alert(
      'Confirm Update',
      'Are you sure you want to update your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setUpdating(true);
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              const res = await fetch('http://10.0.2.2:8080/api/profile/editProfileAdvisor', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  phoneNumber: profile.phoneNumber,
                  departmentId: profile.departmentId,
                }),
              });
              if (!res.ok) throw new Error('Failed to update profile');
              const data = await res.json();
              setProfile(prev => ({
                ...prev,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                departmentId: data.departmentId ?? prev.departmentId,
              }));
              if (data.department) setSelectedDepartmentName(String(data.department));
              Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert('Error', 'Could not update profile');
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8C8CFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F6F7FB' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileCard}>
          {/* Username (Student ID) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Student ID</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profile.username}
              editable={false}
              selectTextOnFocus={false}
              placeholder="Student ID"
              placeholderTextColor="#bbb"
            />
          </View>
          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={profile.firstName}
              onChangeText={text => setProfile({ ...profile, firstName: text })}
              placeholder="Enter first name"
              placeholderTextColor="#aaa"
            />
          </View>
          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={profile.lastName}
              onChangeText={text => setProfile({ ...profile, lastName: text })}
              placeholder="Enter last name"
              placeholderTextColor="#aaa"
            />
          </View>
          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={profile.phoneNumber}
              onChangeText={text => setProfile({ ...profile, phoneNumber: text })}
              placeholder="Enter phone number"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
          {/* Department */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Department</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.86}
            >
              <Text style={{ color: selectedDepartmentName ? '#333' : '#aaa', fontSize: 16 }}>
                {selectedDepartmentName || 'Select department'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Department select modal */}
          <Modal
            visible={isModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Department</Text>
                <FlatList
                  data={departments}
                  keyExtractor={(item) => String(item.departmentId)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.deptItem}
                      onPress={() => {
                        setProfile({ ...profile, departmentId: item.departmentId });
                        setSelectedDepartmentName(item.departmentName);
                        setModalVisible(false);
                      }}
                    >
                      <Text style={styles.deptName}>{item.departmentName}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={() => (
                    <Text style={{ textAlign: 'center', color: '#666' }}>No departments available.</Text>
                  )}
                />
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {/* Update Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleUpdate}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#F6F7FB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F7FB',
  },
  profileCard: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 24,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    color: '#5B5BFF',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#F6F7FB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  disabledInput: {
    backgroundColor: '#eee',
    color: '#888',
  },
  actionButton: {
    backgroundColor: '#5B5BFF',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#8C8CFF',
    height: Platform.OS === 'ios' ? 88 : 56,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  deptItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  deptName: { fontSize: 16 },
  closeButton: { marginTop: 20, backgroundColor: '#f0f0f0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  closeButtonText: { color: '#333', fontWeight: '700', fontSize: 16 },
});

export default EditProfileScreen;