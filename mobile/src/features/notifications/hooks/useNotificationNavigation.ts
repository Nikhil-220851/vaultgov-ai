import { useRouter } from 'expo-router';
import { Notification } from '@/services/api';

export const useNotificationNavigation = () => {
  const router = useRouter();

  const handleNotificationPress = (notification: Notification) => {
    const meta = notification.payload;
    if (!meta) return;

    if (meta.screen === 'DocumentDetail' && meta.document_id) {
      router.push(`/document/${meta.document_id}`);
    } else if (meta.screen === 'SchemeDetail' && meta.scheme_id) {
      router.push(`/schemes/${meta.scheme_id}`);
    } else if (meta.screen === 'Security') {
      router.push('/profile/security');
    } else if (meta.screen === 'CompleteProfile') {
      router.push('/profile/edit');
    } else if (meta.screen === 'Home') {
      router.push('/(tabs)/vault');
    }
  };

  return { handleNotificationPress };
};
