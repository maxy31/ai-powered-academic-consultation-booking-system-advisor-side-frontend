import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Department = {
  departmentId: number;
  departmentName: string;
};

type AdvisorRegisterForm = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  departmentId: number | null;
};

const RegisterScreen = ({ navigation }: any) => {
  const [form, setForm] = useState<AdvisorRegisterForm>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    departmentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDepartmentName, setSelectedDepartmentName] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('http://10.0.2.2:8080/api/auth/showDepartments');
        if (res.ok) {
          const data = await res.json();
          // Expecting [{ departmentId, departmentName }]
          const items: Department[] = Array.isArray(data)
            ? data
                .map((d: any) => ({
                  departmentId: Number(d?.departmentId),
                  departmentName: String(d?.departmentName ?? ''),
                }))
                .filter((d: Department) => !!d.departmentId && !!d.departmentName)
            : [];
          setDepartments(items);
        } else {
          Alert.alert('Error', 'Failed to fetch departments.');
        }
      } catch (error) {
        Alert.alert('Error', 'Could not connect to server to fetch departments.');
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (key: keyof AdvisorRegisterForm, value: any) => setForm({ ...form, [key]: value });

  const handleSelectDepartment = (dept: Department) => {
    handleChange('departmentId', dept.departmentId);
    setSelectedDepartmentName(dept.departmentName);
    setModalVisible(false);
  };

  const handleRegister = async () => {
    // basic client-side check
    if (!form.username || !form.password || !form.firstName || !form.departmentId) {
      Alert.alert('Missing fields', 'Please fill in username, password, first name and select a department');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://10.0.2.2:8080/api/auth/registerAdvisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Ensure body contains departmentId per API contract
        body: JSON.stringify(form),
      });
      if (res.ok) {
        Alert.alert('Success', 'Registration successful. Please login.');
        navigation.goBack();
      } else {
        const txt = await res.text();
        Alert.alert('Registration Failed', txt || 'Please check your details.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={require('../img/LOGO-UTAR.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Create Advisor Account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputRow}>
            <Ionicons name="at-outline" size={18} color="#8C8CFF" style={{ marginRight: 10 }} />
            <TextInput style={styles.input} placeholder="Username" value={form.username} onChangeText={v => handleChange('username', v)} autoCapitalize="none" />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color="#8C8CFF" style={{ marginRight: 10 }} />
            <TextInput style={styles.input} placeholder="First Name" value={form.firstName} onChangeText={v => handleChange('firstName', v)} />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color="#8C8CFF" style={{ marginRight: 10 }} />
            <TextInput style={styles.input} placeholder="Last Name" value={form.lastName} onChangeText={v => handleChange('lastName', v)} />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#8C8CFF" style={{ marginRight: 10 }} />
            <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={v => handleChange('email', v)} keyboardType="email-address" />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="call-outline" size={18} color="#8C8CFF" style={{ marginRight: 10 }} />
            <TextInput style={styles.input} placeholder="Phone Number" value={form.phoneNumber} onChangeText={v => handleChange('phoneNumber', v)} keyboardType="phone-pad" />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#8C8CFF" style={{ marginRight: 10 }} />
            <TextInput style={styles.input} placeholder="Password" value={form.password} onChangeText={v => handleChange('password', v)} secureTextEntry />
          </View>

          <TouchableOpacity style={styles.inputRow} onPress={() => setModalVisible(true)}>
            <Ionicons name="business-outline" size={18} color="#8C8CFF" style={{ marginRight: 10 }} />
            <Text style={[styles.input, !selectedDepartmentName && styles.placeholderText]}>
              {selectedDepartmentName || "Select a Department"}
            </Text>
          </TouchableOpacity>

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
                    <TouchableOpacity style={styles.advisorItem} onPress={() => handleSelectDepartment(item)}>
                      <Text style={styles.advisorName}>{item.departmentName}</Text>
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

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} activeOpacity={0.86}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Register</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
            <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 18, paddingBottom: 36, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 6 },
  logo: { width: 110, height: 110, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '700', color: '#8C8CFF' },
  form: { width: '100%', marginTop: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafafa', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eee', marginTop: 12 },
  input: { flex: 1, fontSize: 15, color: '#222' },
  placeholderText: { color: '#999' },
  registerButton: { marginTop: 20, backgroundColor: '#8C8CFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#8C8CFF', shadowOpacity: 0.16, shadowRadius: 12, elevation: 3 },
  registerButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', color: '#666', marginTop: 16 },
  linkBold: { color: '#8C8CFF', fontWeight: '700' },
  loginLink: { marginTop: 8 },
  // Modal styles
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  advisorItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  advisorName: { fontSize: 16 },
  closeButton: { marginTop: 20, backgroundColor: '#f0f0f0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  closeButtonText: { color: '#333', fontWeight: '700', fontSize: 16 },
});

export default RegisterScreen;