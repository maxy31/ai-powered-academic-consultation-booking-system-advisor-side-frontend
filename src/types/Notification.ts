export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedAppointmentId?: number;
  createdAt: string; // ISO
  read: boolean;
}

export interface PagedNotifications {
  content: NotificationItem[];
  totalElements?: number;
  totalPages?: number;
  number?: number; // current page
}
