import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { NotificationIcon } from './NotificationIcon';
import { Notification } from '@/services/api';
import { useNotificationNavigation } from '../hooks/useNotificationNavigation';
import { useNotificationStore } from '@/store/useNotificationStore';
import { formatDistanceToNow } from 'date-fns';

type NotificationCardProps = {
  notification: Notification;
};

export const NotificationCard = ({ notification }: NotificationCardProps) => {
  const { handleNotificationPress } = useNotificationNavigation();
  const markRead = useNotificationStore((state) => state.markRead);
  const deleteNotification = useNotificationStore((state) => state.deleteNotification);

  const onPress = () => {
    if (!notification.is_read) {
      markRead(notification.id);
    }
    handleNotificationPress(notification);
  };

  const renderRightActions = () => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => deleteNotification(notification.id)}
      >
        <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    );
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity 
        style={[styles.container, !notification.is_read && styles.unreadContainer]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <NotificationIcon 
          category={notification.category} 
          priority={notification.priority} 
          isRead={notification.is_read} 
        />
        
        <View style={styles.content}>
          <Text 
            style={[styles.title, !notification.is_read && styles.unreadTitle]} 
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unreadContainer: {
    backgroundColor: '#F9FAFE',
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.pureBlack,
    marginBottom: 2,
  },
  unreadTitle: {
    fontWeight: Typography.weights.bold,
  },
  message: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    lineHeight: Typography.lineHeights.sm,
    marginBottom: 4,
  },
  time: {
    fontSize: Typography.sizes.xs,
    color: '#9E9E9E',
  },
  deleteAction: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
});
