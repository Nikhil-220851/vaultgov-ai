import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { notificationService } from '@/services/NotificationService';
import { useNotificationStore } from '@/store/useNotificationStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationContextProps {
  isPermissionGranted: boolean;
}

const NotificationContext = createContext<NotificationContextProps>({ isPermissionGranted: false });

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let notificationListener: Notifications.EventSubscription;
    let responseListener: Notifications.EventSubscription;

    const init = async () => {
      // 1. Check if we already asked
      const HAS_ASKED_KEY = '@notification_permission_asked';
      const hasAsked = await AsyncStorage.getItem(HAS_ASKED_KEY);
      
      let granted = await notificationService.checkPermissionStatus();

      if (!granted && !hasAsked) {
        granted = await notificationService.requestPermission();
        await AsyncStorage.setItem(HAS_ASKED_KEY, 'true');
      }

      setIsPermissionGranted(granted);

      // 2. Set up foreground listener
      notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('[NotificationProvider] Foreground notification received:', notification);
        // Refresh store quietly
        const store = useNotificationStore.getState();
        store.fetchUnreadCount();
        store.fetchNotifications(true);
      });

      // 3. Set up response listener (tap)
      responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('[NotificationProvider] Notification tapped:', response);
        const data = response.notification.request.content.data;
        
        if (data?.route) {
          router.push({ pathname: data.route as any, params: data.params as any });
        } else if (data?.screen) {
          // Fallback to older push payload format if needed
          switch (data.screen) {
            case 'DocumentDetail':
              router.push(data.document_id ? `/document/${data.document_id}` : '/(tabs)/docs');
              break;
            case 'SchemeDetail':
              router.push(data.scheme_id ? `/schemes/${data.scheme_id}` : '/(tabs)/schemes');
              break;
            case 'Security':
              router.push('/(tabs)/profile');
              break;
            case 'CompleteProfile':
              router.push('/edit-profile');
              break;
            default:
              router.push('/(tabs)/notifications');
          }
        } else {
          router.push('/(tabs)/notifications');
        }
      });
    };

    init();

    return () => {
      if (notificationListener) notificationListener.remove();
      if (responseListener) responseListener.remove();
    };
  }, [router]);

  return (
    <NotificationContext.Provider value={{ isPermissionGranted }}>
      {children}
    </NotificationContext.Provider>
  );
};
