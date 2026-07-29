import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme';
import { NotificationCard } from './NotificationCard';
import { Notification } from '@/services/api';

type NotificationGroupProps = {
  title: string;
  data: Notification[];
};

export const NotificationGroup = ({ title, data }: NotificationGroupProps) => {
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>
      <View style={styles.cardContainer}>
        {data.map((notification) => (
          <NotificationCard key={notification.id} notification={notification} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  header: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#F5F5F5',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
  },
});
