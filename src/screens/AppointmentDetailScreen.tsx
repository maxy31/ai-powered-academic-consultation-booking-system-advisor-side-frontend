import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert, ScrollView, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppointmentDetail {
  id: number;
  studentName?: string;
  status?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
}

const API_BASE = 'http://10.0.2.2:8080/api/appointments';

export default function AppointmentDetailScreen({ route, navigation }: any) {
  const { appointmentId } = route.params || {};
  const [data, setData] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!appointmentId) { setError('Missing appointment id'); setLoading(false); return; }
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch(`${API_BASE}/get/${appointmentId}`, { headers: { Authorization: token?`Bearer ${token}`:'' } });
        if (!res.ok) throw new Error('Fetch detail failed');
        const json = await res.json();
        if (mounted) { setData(json); }
      } catch (e:any) { if (mounted) setError(e.message || 'Error'); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [appointmentId]);

  const confirm = async () => {
    if (!data) return;
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch(`${API_BASE}/confirmAppointment`, { method:'POST', headers:{'Content-Type':'application/json', Authorization: token?`Bearer ${token}`:''}, body: JSON.stringify({ appointmentId: data.id }) });
      if (!res.ok) throw new Error('Confirm failed');
      Alert.alert('成功','已确认');
    } catch (e:any) { Alert.alert('错误', e.message || '操作失败'); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (error) return <View style={styles.center}><Text style={styles.err}>{error}</Text></View>;
  if (!data) return <View style={styles.center}><Text>No data</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Appointment #{data.id}</Text>
      <Text style={styles.line}>Student: {data.studentName || '-'}</Text>
      <Text style={styles.line}>Status: {data.status}</Text>
      <Text style={styles.line}>Date: {data.date} {data.startTime} - {data.endTime}</Text>
      {data.description && <Text style={styles.line}>Desc: {data.description}</Text>}
      <View style={{ marginTop:16 }}>
        <Button title="Confirm" onPress={confirm} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:16 },
  center:{ flex:1, alignItems:'center', justifyContent:'center' },
  title:{ fontSize:22, fontWeight:'700', marginBottom:12 },
  line:{ fontSize:16, marginBottom:6 },
  err:{ color:'red' }
});
