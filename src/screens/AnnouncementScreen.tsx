import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useIsFocused, NavigationProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type RootStackParamList = {
  EditAnnouncement: { announcement: any };
  CreateAnnouncement: undefined;
};

const AnnouncementScreen = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch('http://10.0.2.2:8080/api/announcements/getAnnouncement', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (Array.isArray(data.announcementList)) {
        setAnnouncements(data.announcementList);
        setError(null);
      } else {
        setAnnouncements([]);
        setError('Invalid data format from server.');
      }
    } catch (err) {
      setError('Failed to fetch announcements.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isFocused) {
      fetchAnnouncements();
    }
  }, [isFocused]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr.replace(' ', 'T'));
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const handleEdit = (announcement: any) => {
    navigation.navigate('EditAnnouncement', { announcement });
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('jwtToken');
              await fetch('http://10.0.2.2:8080/api/announcements/deleteAnnouncement', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
              });
              await fetchAnnouncements();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete announcement.');
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      setHasToken(!!token);
    })();
  }, []);

  return (
  <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator size="large" color="#8C8CFF" />
        ) : error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>{error}</Text>
        ) : announcements.length === 0 ? (
          <Text style={{ color: '#8C8CFF', textAlign: 'center', marginTop: 20 }}>No announcements available.</Text>
        ) : (
          announcements.map((a: any) => (
            <View key={a.id} style={styles.card}>
              <Text style={styles.title}>{a.title}</Text>
              <Text style={styles.authorName}>{a.publisherName}</Text>
              <Text style={styles.content}>{a.content}</Text>
              <View style={styles.divider} />
              <View style={styles.cardFooter}>
                <TouchableOpacity onPress={() => handleEdit(a)}>
                  <Ionicons name="create-outline" size={22} color="#fff" style={styles.actionIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(a.id)}>
                  <Ionicons name="trash-outline" size={22} color="#fff" style={styles.actionIcon} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
  {hasToken && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateAnnouncement')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scroll: { 
    padding: 18, 
    paddingBottom: 90 
  },
  card: {
    backgroundColor: '#8C8CFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 28,
    minHeight: 120,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 8,
  },
  author: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  authorName: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  content: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  divider: {
    borderBottomColor: '#fff',
    borderBottomWidth: 1,
    opacity: 0.5,
    marginBottom: 8,
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 28,
    gap: 16,
  },
  actionIcon: {
    marginHorizontal: 15,
    alignSelf: 'flex-end'
  }
  ,
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 26,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8C8CFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#8C8CFF',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  borderWidth: 2,
  borderColor: 'rgba(255,255,255,0.95)',
  }
});

export default AnnouncementScreen;