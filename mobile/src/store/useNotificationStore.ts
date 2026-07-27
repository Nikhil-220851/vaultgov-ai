import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, Notification } from '@/services/api';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  currentPage: number;
  error: string | null;

  // Actions
  fetchNotifications: (reset?: boolean) => Promise<void>;
  fetchMore: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  
  // Internal
  startPolling: () => void;
  stopPolling: () => void;
  reset: () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;
const POLLING_INTERVAL_MS = 30000; // 30 seconds

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isRefreshing: false,
      hasMore: true,
      currentPage: 1,
      error: null,

      fetchNotifications: async (reset = false) => {
        try {
          if (reset) {
            set({ isRefreshing: true, error: null });
          } else {
            set({ isLoading: true, error: null });
          }

          const page = reset ? 1 : get().currentPage;
          const response = await apiClient.getNotifications(page, 20);

          // TODO: Remove Debug Logs
          console.log(
            "[Notification Debug]",
            response.items.length,
            response.items
          );

          set((state) => {
            const newItems = response.items;
            let merged = reset ? newItems : [...state.notifications, ...newItems];

            // Deduplicate based on ID
            const uniqueMap = new Map();
            merged.forEach((item) => uniqueMap.set(item.id, item));
            merged = Array.from(uniqueMap.values());

            // Sort descending by created_at
            merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            // TODO: Remove Debug Logs
            console.log(
              "[Notification Store]",
              merged.length
            );

            return {
              notifications: merged,
              hasMore: response.has_more,
              currentPage: page,
              isLoading: false,
              isRefreshing: false,
            };
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to load notifications',
            isLoading: false,
            isRefreshing: false,
          });
        }
      },

      fetchMore: async () => {
        const { hasMore, isLoading, currentPage } = get();
        if (!hasMore || isLoading) return;
        
        set({ currentPage: currentPage + 1 });
        await get().fetchNotifications(false);
      },

      fetchUnreadCount: async () => {
        try {
          const response = await apiClient.getUnreadCount();
          set({ unreadCount: response.count });
        } catch (error) {
          console.error('[NotificationStore] Failed to fetch unread count:', error);
        }
      },

      markRead: async (id: string) => {
        // Optimistic update
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));

        try {
          await apiClient.markNotificationRead(id);
        } catch (error) {
          // Revert on failure
          console.error('[NotificationStore] Failed to mark read:', error);
          await get().fetchNotifications(true);
          await get().fetchUnreadCount();
        }
      },

      markAllRead: async () => {
        // Optimistic update
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
          unreadCount: 0,
        }));

        try {
          await apiClient.markAllNotificationsRead();
        } catch (error) {
          console.error('[NotificationStore] Failed to mark all read:', error);
          await get().fetchNotifications(true);
          await get().fetchUnreadCount();
        }
      },

      deleteNotification: async (id: string) => {
        // Optimistic update
        const notification = get().notifications.find((n) => n.id === id);
        const wasUnread = notification && !notification.is_read;
        
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        }));

        try {
          await apiClient.deleteNotification(id);
        } catch (error) {
          console.error('[NotificationStore] Failed to delete notification:', error);
          await get().fetchNotifications(true);
          await get().fetchUnreadCount();
        }
      },

      clearAll: async () => {
        // Optimistic update
        set({ notifications: [], unreadCount: 0, hasMore: false, currentPage: 1 });

        try {
          await apiClient.clearAllNotifications();
        } catch (error) {
          console.error('[NotificationStore] Failed to clear notifications:', error);
          await get().fetchNotifications(true);
          await get().fetchUnreadCount();
        }
      },

      startPolling: () => {
        if (pollingInterval) return;
        
        // Initial fetch
        get().fetchUnreadCount();
        
        pollingInterval = setInterval(() => {
          get().fetchUnreadCount();
        }, POLLING_INTERVAL_MS);
      },

      stopPolling: () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
      },

      reset: () => {
        get().stopPolling();
        set({
          notifications: [],
          unreadCount: 0,
          isLoading: false,
          isRefreshing: false,
          hasMore: true,
          currentPage: 1,
          error: null,
        });
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        notifications: state.notifications, 
        unreadCount: state.unreadCount 
      }), // Persist only these for offline cache
    }
  )
);
