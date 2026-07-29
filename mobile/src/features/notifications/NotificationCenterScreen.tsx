import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme';
import { useNotificationStore } from '@/store/useNotificationStore';
import { EmptyNotifications } from './components/EmptyNotifications';
import { NotificationGroup } from './components/NotificationGroup';
import { isToday, isYesterday } from 'date-fns';
import { Notification } from '@/services/api';

export const NotificationCenterScreen = () => {
  const { 
    notifications, 
    isLoading, 
    isRefreshing, 
    hasMore, 
    fetchNotifications, 
    fetchMore, 
    markAllRead,
    clearAll 
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(true);
  }, []);

  const groupedNotifications = useMemo(() => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const earlier: Notification[] = [];

    notifications.forEach(notif => {
      const date = new Date(notif.created_at);
      if (isToday(date)) {
        today.push(notif);
      } else if (isYesterday(date)) {
        yesterday.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    const groups = [];
    if (today.length > 0) groups.push({ title: 'Today', data: today });
    if (yesterday.length > 0) groups.push({ title: 'Yesterday', data: yesterday });
    if (earlier.length > 0) groups.push({ title: 'Earlier', data: earlier });

    return groups;
  }, [notifications]);

  const handleMarkAllRead = () => {
    markAllRead();
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all your notifications? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", style: "destructive", onPress: () => clearAll() }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={styles.headerTitle}>Notifications</Text>
      {notifications.length > 0 && (
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.actionText}>Mark all read</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Text style={styles.actionTextClear}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primaryBlue} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {isLoading && notifications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primaryBlue} />
        </View>
      ) : (
        <FlatList
          data={groupedNotifications}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) => <NotificationGroup title={item.title} data={item.data} />}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContainer}
          ListEmptyComponent={EmptyNotifications}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={() => fetchNotifications(true)} 
              tintColor={Colors.primaryBlue}
            />
          }
          onEndReached={() => fetchMore()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: 4,
  },
  actionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primaryBlue,
    fontWeight: Typography.weights.medium,
  },
  clearBtn: {
    marginLeft: Spacing.xs,
  },
  actionTextClear: {
    fontSize: Typography.sizes.sm,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
  },
  listContainer: {
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoader: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
});
