import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://10.0.2.2:8080';

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(async cfg => {
  const token = await AsyncStorage.getItem('jwtToken');
  if (token) {
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

export async function getUnreadCount() {
  const { data } = await api.get<number>('/api/notifications/unread-count');
  return data;
}
export async function getNotifications(page = 0, size = 20, unreadOnly = false) {
  const { data } = await api.get(`/api/notifications`, { params: { page, size, unreadOnly } });
  return data;
}
export async function markOneRead(id: number) {
  const { data } = await api.post(`/api/notifications/${id}/read`);
  return data;
}
export async function markAllRead() {
  await api.post(`/api/notifications/mark-all-read`);
}
export async function markBatchRead(ids: number[]) {
  await api.post(`/api/notifications/mark-read-batch`, { ids });
}
export async function deleteOne(id: number) {
  await api.delete(`/api/notifications/${id}`);
}
export async function deleteBatch(ids: number[]) {
  await api.post(`/api/notifications/delete-batch`, { ids });
}
