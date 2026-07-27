import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';

type NotificationIconProps = {
  category: string;
  priority: string;
  isRead: boolean;
};

const getCategoryConfig = (category: string) => {
  switch (category) {
    case 'DOCUMENT':
      return { icon: 'document-text' as const, bg: '#E3F2FD', color: Colors.primaryBlue };
    case 'SCHEME':
      return { icon: 'business' as const, bg: '#F3E5F5', color: '#9C27B0' };
    case 'SECURITY':
      return { icon: 'shield-checkmark' as const, bg: '#E8F5E9', color: Colors.primaryGreen };
    case 'AI':
      return { icon: 'sparkles' as const, bg: '#FFF8E1', color: '#FFB300' };
    case 'UPLOAD':
      return { icon: 'cloud-upload' as const, bg: '#E0F7FA', color: '#00BCD4' };
    case 'SUMMARY':
      return { icon: 'bar-chart' as const, bg: '#FFF3E0', color: '#FF9800' };
    default:
      return { icon: 'notifications' as const, bg: '#F5F5F5', color: Colors.darkGray };
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL':
      return Colors.error;
    case 'HIGH':
      return '#FF9800'; // Orange
    case 'MEDIUM':
      return Colors.primaryBlue;
    default:
      return null;
  }
};

export const NotificationIcon = ({ category, priority, isRead }: NotificationIconProps) => {
  const config = getCategoryConfig(category);
  const priorityColor = getPriorityColor(priority);

  return (
    <View style={[styles.container, { backgroundColor: isRead ? '#F5F5F5' : config.bg }]}>
      <Ionicons 
        name={config.icon} 
        size={24} 
        color={isRead ? Colors.darkGray : config.color} 
      />
      {/* Priority Indicator Dot */}
      {priorityColor && !isRead && (
        <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  priorityDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
