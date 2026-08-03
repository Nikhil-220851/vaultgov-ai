import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from './api';

// Handle foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private isConfigured = false;
  private router: any = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  // Track scheduled notification IDs so we don't schedule duplicates during polling
  private scheduledNotificationIds = new Set<string>();

  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { granted: existingGranted } = await Notifications.getPermissionsAsync();
    let finalGranted = existingGranted;
    
    if (!existingGranted) {
      const { granted } = await Notifications.requestPermissionsAsync();
      finalGranted = granted;
    }

    return finalGranted;
  }

  async checkPermissionStatus(): Promise<boolean> {
    const { granted } = await Notifications.getPermissionsAsync();
    return granted;
  }

  /**
   * Generates the native FCM device token.
   */
  async getDeviceToken(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('[NotificationService] Must use physical device for Push Notifications');
      return null;
    }

    const granted = await this.requestPermission();
    if (!granted) {
      console.warn('[NotificationService] Permission not granted for push notifications.');
      return null;
    }

    try {
      // Get the native device push token (FCM on Android, APNs on iOS)
      const tokenResponse = await Notifications.getDevicePushTokenAsync();
      const token = tokenResponse.data;
      console.log('[NotificationService] Native Device Push Token:', token);
      return token;
    } catch (error) {
      console.error('[NotificationService] Error getting device push token:', error);
      return null;
    }
  }

  /**
   * Registers the device token with the backend.
   */
  async registerTokenWithBackend(): Promise<void> {
    const token = await this.getDeviceToken();
    if (token) {
      try {
        await apiClient.registerDeviceToken(token, Platform.OS);
        console.log('[NotificationService] Token successfully registered with backend.');
      } catch (error) {
        console.error('[NotificationService] Failed to register token with backend:', error);
      }
    }
  }

  /**
   * Schedules a local notification for a new unread item received during polling.
   * Uses deduplicationId to prevent the same notification being shown twice.
   *
   * @param content  Notification title, body, and data payload
   * @param deduplicationId  Unique ID (e.g. notification DB id) to prevent duplicates
   */
  async scheduleLocalNotification(
    content: { title: string; body: string; data?: Record<string, unknown> },
    deduplicationId?: string
  ): Promise<void> {
    if (deduplicationId && this.scheduledNotificationIds.has(deduplicationId)) {
      return; // Already shown this one
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: content.data ?? {},
        },
        trigger: null, // Show immediately
      });
      if (deduplicationId) {
        this.scheduledNotificationIds.add(deduplicationId);
      }
    } catch (error) {
      console.error('[NotificationService] Failed to schedule local notification:', error);
    }
  }

  /**
   * Cancels all pending scheduled local notifications and clears the deduplication cache.
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotificationIds.clear();
    } catch (error) {
      console.error('[NotificationService] Failed to cancel all notifications:', error);
    }
  }

  /**
   * Setups listeners for token refresh, foreground messages, and background taps.
   */
  setupNotificationHandlers(router: any) {
    if (this.isConfigured) return;
    this.router = router;

    // Listen for FCM token changes (if Firebase rotates it)
    // Note: Expo doesn't have a direct "onTokenRefresh" listener in expo-notifications, 
    // but the token is stable. You can call getDevicePushTokenAsync on app start to update it.
    this.registerTokenWithBackend();

    // Foreground notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('[NotificationService] Notification received in foreground:', notification);
    });

    // Background/Terminated notifications tapped
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[NotificationService] Notification tapped:', response);
      const data = response.notification.request.content.data;
      
      if (data?.screen && this.router) {
        switch (data.screen) {
          case 'DocumentDetail':
            if (data.document_id) {
              this.router.push(`/document/${data.document_id}`);
            } else {
              this.router.push('/(tabs)/docs');
            }
            break;
          case 'SchemeDetail':
            if (data.scheme_id) {
              this.router.push(`/schemes/${data.scheme_id}`);
            } else {
              this.router.push('/(tabs)/schemes');
            }
            break;
          default:
            this.router.push('/(tabs)/notifications');
        }
      } else if (this.router) {
        this.router.push('/(tabs)/notifications');
      }
    });

    this.isConfigured = true;
  }

  removeNotificationHandlers() {
    if (this.notificationListener) this.notificationListener.remove();
    if (this.responseListener) this.responseListener.remove();
    this.isConfigured = false;
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number): Promise<boolean> {
    return await Notifications.setBadgeCountAsync(count);
  }

  async clearBadgeCount(): Promise<boolean> {
    return await Notifications.setBadgeCountAsync(0);
  }
}

export const notificationService = new NotificationService();
