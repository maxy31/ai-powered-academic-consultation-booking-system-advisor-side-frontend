import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const LoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://10.0.2.2:8080/api/auth/loginAdvisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const text = await res.text();
      if (res.ok) {
        const data = JSON.parse(text);
        await AsyncStorage.setItem('jwtToken', data.token);
        navigation.replace('Main');
      } else {
        Alert.alert('Login Failed', 'Invalid credentials');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../img/LOGO-UTAR.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Advisor Login</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={20} color="#8C8CFF" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#9b9b9b"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        <View style={[styles.inputRow, { marginTop: 12 }]}>
          <Ionicons name="lock-closed-outline" size={20} color="#8C8CFF" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9b9b9b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
          />
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          activeOpacity={0.85}
          accessibilityLabel="Login"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerRow}>
          <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
  header: { alignItems: 'center', paddingVertical: 24 },
  logo: { width: 120, height: 120, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#8C8CFF' },
  form: { paddingHorizontal: 28, marginTop: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafafa', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eee' },
  input: { flex: 1, fontSize: 16, color: '#222' },
  loginButton: { marginTop: 20, backgroundColor: '#8C8CFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#8C8CFF', shadowOpacity: 0.18, shadowRadius: 12, elevation: 3 },
  loginButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', color: '#666', marginTop: 14 },
  linkBold: { color: '#8C8CFF', fontWeight: '700' },
  registerRow: { marginTop: 8 },
});

export default LoginScreen;