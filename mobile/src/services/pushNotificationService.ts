import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiClient } from './api';
import { useNotificationStore } from '@/store/useNotificationStore';

// Configure how notifications behave when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const pushNotificationService = {
  /**
   * Requests permission and registers for Expo Push Notifications.
   * Sends the token to the backend.
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('[PushService] Failed to get push token for push notification!');
        return null;
      }

      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;

        if (!projectId) {
          console.warn('[PushService] Project ID not found');
          return null;
        }

        const tokenResponse = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        token = tokenResponse.data;
        
        console.log('[PushService] Expo Push Token:', token);
        
        // Send to backend
        await apiClient.registerPushToken(token);
        
      } catch (error) {
        console.error('[PushService] Error getting push token:', error);
      }
    } else {
      console.log('[PushService] Must use physical device for Push Notifications');
    }

    return token;
  },

  /**
   * Sets up listeners for incoming notifications and user taps.
   * Should be called once at the root level (e.g., _layout.tsx).
   */
  setupNotificationHandlers(router: any) {
    // Fired when a notification is received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('[PushService] Notification received:', notification);
      
      // Tell Zustand store to refetch count and list
      const store = useNotificationStore.getState();
      store.fetchUnreadCount();
      // Fetch latest quietly in background
      store.fetchNotifications(true);
    });

    // Fired when the user taps on a notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[PushService] Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle Deep Linking based on metadata payload
      if (data?.screen) {
        switch (data.screen) {
          case 'DocumentDetail':
            if (data.document_id) {
              router.push(`/document/${data.document_id}`);
            } else {
              router.push('/(tabs)/vault');
            }
            break;
          case 'SchemeDetail':
            if (data.scheme_id) {
              router.push(`/schemes/${data.scheme_id}`);
            } else {
              router.push('/(tabs)/schemes');
            }
            break;
          case 'Security':
            router.push('/profile/security');
            break;
          case 'CompleteProfile':
            router.push('/profile/edit');
            break;
          default:
            router.push('/(tabs)/notifications');
        }
      } else {
        // Fallback to Notification Center
        router.push('/(tabs)/notifications');
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }
};
