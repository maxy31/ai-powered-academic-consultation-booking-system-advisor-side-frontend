import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const CreateAnnouncementScreen = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validation', 'Please enter both title and content.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch('http://10.0.2.2:8080/api/announcements/createAnnouncement', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Announcement created!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const text = await res.text();
        Alert.alert('Error', `Failed to create announcement: ${text}`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to create announcement.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Announcement</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.outerContainer}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Announcement</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder="Content"
            placeholderTextColor="#aaa"
            multiline
          />

          <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5ff' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#8C8CFF',
    height: Platform.OS === 'ios' ? 88 : 56,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingHorizontal: 16,
    shadowColor: '#8C8CFF',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', flex: 1 },
  outerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  formCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    shadowColor: '#8C8CFF',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'stretch',
  },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: '#8C8CFF', marginBottom: 18, textAlign: 'center' },
  input: { backgroundColor: '#f5f5ff', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 18, color: '#333', borderWidth: 1, borderColor: '#e0e0ff' },
  textArea: { height: 140, textAlignVertical: 'top' },
  button: { backgroundColor: '#8C8CFF', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  cancelButton: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: '#8C8CFF' },
  cancelButtonText: { color: '#8C8CFF', fontWeight: 'bold', fontSize: 16 },
});

export default CreateAnnouncementScreen;
