import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SectionList,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

interface AvailabilitySlot {
  day: string;        // e.g. Mon
  date: string;       // yyyy-MM-dd (backend now returns concrete date within two-week window)
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
}

// Availability list endpoint (expects POST with { appointmentId })
const ENDPOINT = 'http://10.0.2.2:8080/api/availability/advisor/free';
// Create appointment endpoint
const EDIT_APPT_ENDPOINT = 'http://10.0.2.2:8080/api/appointments/editAppointment';

const DAY_ORDER = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_LABEL: Record<string,string> = {Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday',Sat:'Saturday',Sun:'Sunday'};

interface RouteParams { appointmentId?: number }

const SearchScreen = () => {
  const route = useRoute();
  const { appointmentId } = (route.params as RouteParams) || {};
  const navigation = useNavigation<any>();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedObj, setSelectedObj] = useState<AvailabilitySlot | null>(null);
  const [calendarDays, setCalendarDays] = useState<Date[]>([]); // derived from slots
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // 已预约 (按具体日期) key: yyyy-mm-dd|start|end
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const sectionListRef = useRef<SectionList<AvailabilitySlot, { title: string; data: AvailabilitySlot[] }>>(null);

  // Derive calendar dates from returned slots (unique dates, sorted) – limited to first 10 (Mon–Fri x2)
  useEffect(() => {
    if (!slots.length) return;
    const today = new Date(); today.setHours(0,0,0,0);
    const unique = Array.from(new Set(slots.map(s => s.date)))
      .map(ds => {
        const [y,m,d] = ds.split('-').map(Number); return new Date(y!, (m! - 1), d!);
      })
      .sort((a,b)=> a.getTime()-b.getTime())
      .slice(0,10);
    setCalendarDays(unique);
    if (!selectedDate) {
      const firstValid = unique.find(d => d.getTime() >= today.getTime()) || unique[0];
      setSelectedDate(firstValid);
    }
  }, [slots]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('NO_TOKEN');
      }
      if (!appointmentId) {
        throw new Error('NO_APPT_ID');
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000); // 10s timeout
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error('Network response not ok');
      const data: AvailabilitySlot[] = await res.json();
      setSlots(data);
    } catch (e: any) {
      if (e.name === 'AbortError') setError('请求超时');
      else if (e.message === 'NO_TOKEN') setError('未获取到登录令牌');
      else if (e.message === 'NO_APPT_ID') setError('缺少预约ID');
      else setError('加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appointmentId]);

  useFocusEffect(
    useCallback(() => {
      if (appointmentId) fetchData();
    }, [fetchData, appointmentId])
  );

  useEffect(() => {
    if (slots.length === 0 && !loading && appointmentId) fetchData();
  }, [appointmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = () => fetchData(true);

  const selectedDateStr = useMemo(() => {
    if (!selectedDate) return null;
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth()+1).padStart(2,'0');
    const d = String(selectedDate.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  type SlotSection = { title: string; data: AvailabilitySlot[] };

  const sections: SlotSection[] = useMemo(() => {
    if (!slots.length || !selectedDateStr) return [];
    const filtered = slots
      .filter(s => s.date === selectedDateStr)
      .sort((a,b)=> a.startTime.localeCompare(b.startTime));
    if (!filtered.length) return [];
    return [{ title: selectedDateStr, data: filtered }];
  }, [slots, selectedDateStr]);

  const handleSelect = (item: AvailabilitySlot) => {
    const key = `${item.date}-${item.startTime}-${item.endTime}`;
    const isSame = key === selectedKey;
    setSelectedKey(isSame ? null : key);
    setSelectedObj(isSame ? null : item);
  };

  const renderItem = ({ item }: { item: AvailabilitySlot }) => {
    const key = `${item.date}-${item.startTime}-${item.endTime}`;
    const selected = key === selectedKey;
    // Backend已过滤掉已被占用的 slot；本地 bookedSlots 仅做乐观标记（仍显示标签）
    const isBooked = bookedSlots.has(`${item.date}|${item.startTime}|${item.endTime}`);
    return (
      <TouchableOpacity
        style={[styles.slotPill, selected && styles.slotPillSelected, isBooked && styles.slotPillBooked]}
        onPress={() => { if (!isBooked) handleSelect(item); }}
        activeOpacity={isBooked ? 1 : 0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.slotContentRow}>
          <Icon name="time-outline" size={18} color={selected ? '#FFF' : (isBooked ? '#D5D7E8' : '#E6E8FF')} style={{ marginRight: 8 }} />
          <Text style={[styles.slotText, isBooked && styles.slotTextBooked]}>{item.startTime} - {item.endTime}</Text>
          {isBooked && <View style={styles.bookedBadge}><Text style={styles.bookedBadgeText}>已预约</Text></View>}
          {selected && !isBooked && <Icon name="checkmark-circle" size={22} color="#FFFFFF" style={styles.checkIcon} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: SlotSection }) => (
    <View style={styles.sectionHeader}> 
      <View style={styles.dayBadge}>
        <Text style={styles.dayBadgeText}>{section.title}</Text>
      </View>
    </View>
  );

  const dayMap = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const formatChipLabel = (d: Date) => `${dayMap[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}`;

  const isDateDisabled = (d: Date) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d < todayStart; // disable past dates
  };

  const onSelectDate = (d: Date) => {
    if (isDateDisabled(d)) return;
    setSelectedDate(d);
    // clear previous slot selection when date changes
    setSelectedKey(null); setSelectedObj(null);
    // scroll to top of list
    setTimeout(()=> sectionListRef.current?.scrollToLocation({ sectionIndex:0, itemIndex:0, animated:true }), 50);
  };

  const editAppointment = async () => {
    if (!selectedObj || !selectedDate || submitting) return;
    if (!appointmentId) { Alert.alert('错误', '缺少预约ID'); return; }
    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) { Alert.alert('错误', '未获取到登录令牌'); return; }
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      // Backend AppointmentUpdateRequest expects: id, date, startTime, endTime
      const body = {
        id: appointmentId,
        date: `${yyyy}-${mm}-${dd}`,
        startTime: selectedObj.startTime,
        endTime: selectedObj.endTime,
      };
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(EDIT_APPT_ENDPOINT, {
        method: 'PUT',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      clearTimeout(timer);
      if (!res.ok) {
        let msg = `提交失败 (${res.status})`;
        try { const t = await res.text(); if (t) msg = t; } catch {}
        Alert.alert('失败', msg);
        return;
      }
      // 成功：返回上一页，StudentScreen 会在 focus 时自动刷新
      Alert.alert('成功', '预约已更新', [
        { text: '确定', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      if (e.name === 'AbortError') Alert.alert('超时', '请求超时, 请重试');
      else Alert.alert('错误', '网络或服务器错误');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && slots.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8C8CFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBox}>
        <Text style={styles.screenTitle}>Free Time Slots</Text>
  <Text style={styles.screenSubtitle}>Tap a slot to select (Appt ID: {appointmentId ?? '-'})</Text>
      </View>
      <View style={styles.listContainer}>
        {/* Date Selector (horizontal) */}
        <View style={styles.calendarRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScrollContent}
          >
            {calendarDays.map(d => {
              const sel = selectedDate && d.toDateString() === selectedDate.toDateString();
              const disabled = isDateDisabled(d);
              const isToday = (new Date()).toDateString() === d.toDateString();
              const dayName = dayMap[d.getDay()];
              const dayNum = String(d.getDate()).padStart(2,'0');
              return (
                <TouchableOpacity
                  key={d.toISOString()}
                  onPress={() => onSelectDate(d)}
                  activeOpacity={0.85}
                  disabled={disabled}
                  style={[
                    styles.dateCard,
                    sel && styles.dateCardSelected,
                    disabled && styles.dateCardDisabled,
                  ]}
                >
                  {isToday && !sel && !disabled ? (
                    <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>Today</Text></View>
                  ) : null}
                  <Text style={[styles.dateCardWeek, sel && styles.dateCardWeekSelected, disabled && styles.dateCardTextDisabled]}>{dayName}</Text>
                  <Text style={[styles.dateCardNum, sel && styles.dateCardNumSelected, disabled && styles.dateCardTextDisabled]}>{dayNum}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        {error && (
          <TouchableOpacity onPress={() => fetchData()} style={styles.errorBox}>
            <Text style={styles.errorText}>{error}，点此重试</Text>
          </TouchableOpacity>
        )}
  <SectionList<AvailabilitySlot, { title: string; data: AvailabilitySlot[] }>
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => `${item.date}-${item.startTime}-${item.endTime}`}
          contentContainerStyle={styles.flatContent}
            renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#5B5BFF"]} />}
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>暂无可用时间段</Text> : null}
        />
      </View>
  <View style={styles.footerBar}> 
        <TouchableOpacity
          disabled={!selectedObj || submitting}
          style={[styles.confirmBtn, (!selectedObj || submitting) && styles.confirmBtnDisabled]}
          onPress={editAppointment}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          ) : (
            <Icon name="checkmark" size={18} color="#fff" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.confirmText}>{submitting ? 'Submitting...' : (selectedObj ? 'Confirm Slot' : 'Select a Slot')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EEF0FF' },
  headerBox: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#8C8CFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  screenTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  screenSubtitle: { color: '#F2F3FF', marginTop: 2, fontSize: 13 },
  listContainer: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  calendarRow: { marginBottom: 10 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }, // kept for legacy use
  dateScrollContent: { paddingHorizontal: 4, paddingVertical: 2 },
  dateCard: {
    width: 70,
    height: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE0F5',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dateCardSelected: {
    backgroundColor: '#5B5BFF',
    borderColor: '#5B5BFF',
    elevation: 3,
    shadowOpacity: 0.18,
  },
  dateCardDisabled: { opacity: 0.4 },
  dateCardWeek: { fontSize: 12, fontWeight: '600', color: '#5A5E7A', marginBottom: 6 },
  dateCardWeekSelected: { color: '#FFFFFF' },
  dateCardNum: { fontSize: 24, fontWeight: '700', color: '#364065' },
  dateCardNumSelected: { color: '#FFFFFF' },
  dateCardTextDisabled: { color: '#9AA0B8' },
  todayBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFE08A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayBadgeText: { fontSize: 10, fontWeight: '700', color: '#614800' },
  weekLabel: { fontSize: 12, fontWeight: '600', color:'#4C4AA1', marginLeft:4, marginBottom:4, opacity:0.7 },
  dateChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7DAE9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    flex: 1,
    marginHorizontal: 4,
  },
  dateChipSelected: {
    backgroundColor: '#5B5BFF',
    borderColor: '#5B5BFF',
    elevation: 2,
    shadowOpacity: 0.15,
  },
  dateChipToday: { borderColor: '#5B5BFF' },
  dateChipDisabled: { opacity: 0.4 },
  dateChipText: { color: '#4C4AA1', fontWeight: '600', fontSize: 13 },
  dateChipTextSelected: { color: '#FFFFFF' },
  dateChipTextDisabled: { color: '#999' },
  flatContent: { paddingBottom: 120 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF0FF',
  },
  loadingText: { marginTop: 10, color: '#555' },
  sectionHeader: {
    backgroundColor: '#EEF0FF', // solid so sticky header不与下方重叠视觉冲突
    paddingTop: 10,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  dayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E4E7F5',
  },
  dayBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4C4AA1',
    letterSpacing: 0.5,
  },
  slotPill: {
    backgroundColor: '#8C8CFF',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 22,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  slotPillSelected: {
    backgroundColor: '#3532B3',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  slotPillBooked: {
    backgroundColor: '#A7A9D6',
  },
  slotContentRow: { flexDirection: 'row', alignItems: 'center' },
  slotText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  slotTextBooked: { color: '#F5F6FB', textDecorationLine: 'line-through' },
  bookedBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  bookedBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  checkIcon: { marginLeft: 10 },
  errorBox: {
    backgroundColor: '#FFE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: { color: '#B00020', textAlign: 'center' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 60, fontSize: 16 },
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  },
  confirmBtn: {
    backgroundColor: '#5B5BFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnDisabled: { backgroundColor: '#B3B8DA' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});

export default SearchScreen;