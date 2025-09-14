
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused, useNavigation } from '@react-navigation/native';

interface Appointment {
  id: number;
  studentId: number;
  advisorId: number;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm:ss
  endTime: string;    // HH:mm:ss
  status: string;     // "PENDING" | "CONFIRMED" | others
}

const StudentScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  const endpoint = `http://10.0.2.2:8080/api/appointments/getAppointmentsList`;

  const fetchAppointments = useCallback(async () => {
    setError(null);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        setError('Missing authentication token');
        setAppointments([]);
        return;
      }
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      if (Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
      } else {
        setAppointments([]);
        setError('Unexpected response structure');
      }
    } catch (e: any) {
      setError(e.message || 'Error fetching appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      fetchAppointments();
    }
  }, [isFocused, fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  // ---- Action API helpers ----
  const API_BASE = 'http://10.0.2.2:8080/api/appointments';

  const postAction = async (url: string, appointmentId: number) => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) throw new Error('Missing authentication token');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ appointmentId }),
    });
    if (!res.ok) {
      let msg = `Server responded with ${res.status}`;
      try { const j = await res.json(); if (j.message) msg = j.message; } catch {}
      throw new Error(msg);
    }
    return res.json().catch(() => ({}));
  };

  const afterActionRefresh = async () => {
    // 简单方式：重新拉取最新列表
    await fetchAppointments();
  };

  const handleAccept = (appt: Appointment) => {
    setActionBusyId(appt.id);
    postAction(`${API_BASE}/confirmAppointment`, appt.id)
      .then(() => {
        Alert.alert('Success', 'The appointment has been accepted');
        return afterActionRefresh();
      })
      .catch(e => Alert.alert('Failed', e.message))
      .finally(() => setActionBusyId(null));
  };

  const handleReject = (appt: Appointment) => {
    Alert.alert('Reject Appointment', 'Are you sure you want to reject this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Rejected', style: 'destructive', onPress: () => {
          setActionBusyId(appt.id);
          postAction(`${API_BASE}/rejectAppointment`, appt.id)
            .then(() => {
              Alert.alert('Rejected', 'The appointment has been rejected');
              return afterActionRefresh();
            })
            .catch(e => Alert.alert('Failed', e.message))
            .finally(() => setActionBusyId(null));
        }
      }
    ]);
  };

  // Edit: 跳转到 Search 页面，可传递当前预约信息（按需使用）
  const handleEdit = (appt: Appointment) => {
    navigation.navigate('Search', { appointmentId: appt.id });
  };

  const handleCancel = (appt: Appointment) => {
    Alert.alert('Delete Appointment', 'Are you sure you want to delete this appointment?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes', style: 'destructive', onPress: () => {
          setActionBusyId(appt.id);
          postAction(`${API_BASE}/deleteAppointment`, appt.id)
            .then(() => {
              Alert.alert('Deleted', 'The appointment has been deleted');
              return afterActionRefresh();
            })
            .catch(e => Alert.alert('Failed', e.message))
            .finally(() => setActionBusyId(null));
        }
      }
    ]);
  };

  const pending = appointments.filter(a => a.status === 'PENDING');
  const confirmed = appointments.filter(a => a.status === 'CONFIRMED');

  const formatDate = (d: string) => {
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch { return d; }
  };
  const formatTime = (t: string) => t?.slice(0,5);

  const renderAppt = (appt: Appointment, status: 'PENDING' | 'CONFIRMED') => {
    const busy = actionBusyId === appt.id;
    return (
      <View key={appt.id} style={styles.card}>
        <View style={styles.cardRowTop}>
          <Text style={styles.cardDate}>{formatDate(appt.date)}</Text>
          <Text style={styles.cardTime}>{formatTime(appt.startTime)} - {formatTime(appt.endTime)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.actionsRow}>
          {status === 'PENDING' ? (
            <>
              <ActionBtn icon="checkmark-circle" label="Accept" color="#4CAF50" onPress={() => handleAccept(appt)} disabled={busy} />
              <ActionBtn icon="close-circle" label="Reject" color="#FF6B6B" onPress={() => handleReject(appt)} disabled={busy} />
            </>
          ) : (
            <>
              <ActionBtn icon="create" label="Edit" color="#FFA726" onPress={() => handleEdit(appt)} disabled={busy} />
              <ActionBtn icon="trash" label="Cancel" color="#FF6B6B" onPress={() => handleCancel(appt)} disabled={busy} />
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8C8CFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#8C8CFF"]} />}
    >
      <Text style={styles.header}>Appointments</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pending</Text>
          <View style={styles.countPill}><Text style={styles.countPillText}>{pending.length}</Text></View>
        </View>
        {pending.length === 0 && <Text style={styles.empty}>No pending appointments</Text>}
        {pending.map(a => renderAppt(a, 'PENDING'))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Confirmed</Text>
          <View style={[styles.countPill, { backgroundColor: '#6E63FF' }]}><Text style={styles.countPillText}>{confirmed.length}</Text></View>
        </View>
        {confirmed.length === 0 && <Text style={styles.empty}>No confirmed appointments</Text>}
        {confirmed.map(a => renderAppt(a, 'CONFIRMED'))}
      </View>
    </ScrollView>
  );
};

interface ActionBtnProps { icon: string; label: string; color: string; onPress: () => void; disabled?: boolean }
const ActionBtn = ({ icon, label, color, onPress, disabled }: ActionBtnProps) => (
  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color, opacity: disabled ? 0.5 : 1 }]} onPress={onPress} disabled={disabled} activeOpacity={0.85}>
    <Ionicons name={icon} size={16} color="#fff" style={{ marginRight: 6 }} />
    <Text style={styles.actionBtnText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: '700', color: '#222', marginBottom: 12 },
  error: { color: '#FF3B30', marginBottom: 8 },
  section: { marginTop: 10 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#8C8CFF', marginRight: 10 },
  countPill: { backgroundColor: '#8C8CFF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  countPillText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: { color: '#888', fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: '#F7F6FF',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E2FF',
  },
  cardRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardDate: { fontSize: 16, fontWeight: '700', color: '#333' },
  cardTime: { fontSize: 14, fontWeight: '600', color: '#6E63FF' },
  divider: { height: 1, backgroundColor: '#E4E1FF', marginVertical: 8 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 22 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});

export default StudentScreen;
