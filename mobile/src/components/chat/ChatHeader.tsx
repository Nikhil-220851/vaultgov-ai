"use no memo";
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';

interface ChatHeaderProps {
  onBackPress?: () => void;
  onClearPress?: () => void;
}

export function ChatHeader({ onBackPress, onClearPress }: ChatHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {onBackPress && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onBackPress}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.primaryBlue} />
          </TouchableOpacity>
        )}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.activeDot} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>GovAssist AI</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.statusText}>Online</Text>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.providerText}>Powered by Gemini</Text>
          </View>
        </View>
      </View>
      {onClearPress && (
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onClearPress}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.primaryBlue} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'ios' ? 70 : 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EBF2FF',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#D4E2FD',
    ...Platform.select({
      ios: {
        shadowColor: '#1977F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4E2FD',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  activeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryGreen,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  titleWrap: {
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    letterSpacing: -0.2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  statusText: {
    fontSize: Typography.sizes.xs - 1,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryGreen,
  },
  bullet: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.darkGray,
  },
  providerText: {
    fontSize: Typography.sizes.xs - 1,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
  },
});
