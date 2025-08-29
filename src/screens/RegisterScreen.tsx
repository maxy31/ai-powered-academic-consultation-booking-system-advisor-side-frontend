import React, { useState } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const RegisterScreen = ({ navigation }: any) => {
  const [form, setForm] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: string) => setForm({ ...form, [key]: value });

  const handleRegister = async () => {
    // basic client-side check
    if (!form.username || !form.password || !form.firstName) {
      Alert.alert('Missing fields', 'Please fill in username, password and first name');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://10.0.2.2:8080/api/auth/registerAdvisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

          <View style={styles.inputRow}>
            <Ionicons name="business-outline" size={18} color="#8C8CFF" style={{ marginRight: 10 }} />
            <TextInput style={styles.input} placeholder="Department" value={form.department} onChangeText={v => handleChange('department', v)} />
          </View>

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
  registerButton: { marginTop: 20, backgroundColor: '#8C8CFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#8C8CFF', shadowOpacity: 0.16, shadowRadius: 12, elevation: 3 },
  registerButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', color: '#666', marginTop: 16 },
  linkBold: { color: '#8C8CFF', fontWeight: '700' },
  loginLink: { marginTop: 8 },
});

export default RegisterScreen;