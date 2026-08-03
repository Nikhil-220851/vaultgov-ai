import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPayload {
  title: string;
  body: string;
  data?: {
    type?: string;
    route?: string;
    params?: Record<string, any>;
    timestamp?: string;
    notificationId?: string;
    [key: string]: any;
  };
}

class NotificationService {
  /**
   * Request push notification permissions (only ask once).
   */
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

  /**
   * Check if permissions are currently granted.
   */
  async checkPermissionStatus(): Promise<boolean> {
    const { granted } = await Notifications.getPermissionsAsync();
    return granted;
  }

  /**
   * Schedules a local notification. Avoids duplicates by utilizing a unique identifier if possible.
   */
  async scheduleLocalNotification(payload: NotificationPayload, identifier?: string): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      identifier, // Used to avoid duplicate scheduling
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data,
      },
      trigger: null, // trigger immediately
    });
  }

  /**
   * Cancels a specific scheduled notification by ID.
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancels all scheduled local notifications.
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Gets the current badge count.
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Sets the badge count directly.
   */
  async setBadgeCount(count: number): Promise<boolean> {
    return await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clears the badge count (sets to 0).
   */
  async clearBadgeCount(): Promise<boolean> {
    return await Notifications.setBadgeCountAsync(0);
  }
}

export const notificationService = new NotificationService();
