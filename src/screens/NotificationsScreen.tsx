import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNotifications } from '../context/NotificationsContext';
import Icon from 'react-native-vector-icons/Ionicons';

export default function NotificationsScreen() {
  const { notifications, loading, loadMore, refresh, markRead, connectionStatus, reconnect, testLocalNotification } = useNotifications();

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} colors={['#8C8CFF']} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.item, !item.read && styles.itemUnread]} onPress={() => !item.read && markRead(item.id)}>
            <View style={styles.itemHeader}> 
              <Text style={styles.itemTitle}>{item.title || item.type}</Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.itemMsg}>{item.message}</Text>
            <Text style={styles.itemTime}>{new Date(item.createdAt).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No notifications</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContent: { padding: 16 },
  item: { padding: 14, borderRadius: 12, backgroundColor: '#F7F7FF', marginBottom: 12, borderWidth: 1, borderColor: '#ECECFA' },
  itemUnread: { backgroundColor: '#EDEBFF', borderColor: '#D6D3FF' },
  itemHeader: { flexDirection: 'row', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#322F70', flex: 1 },
  itemMsg: { marginTop: 6, color: '#444', lineHeight: 18 },
  itemTime: { marginTop: 8, fontSize: 12, color: '#777' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5B5BFF', marginLeft: 8 },
  empty: { textAlign: 'center', marginTop: 80, color: '#666' },
  statusBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, backgroundColor: '#F2F2FF' },
  statusText: { flex: 1, fontSize: 12, color: '#555' },
  reconnectBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#8C8CFF', borderRadius: 6 },
  reconnectText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
