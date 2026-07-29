"use no memo";
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { Colors, Spacing, Radius } from '@/theme';

function SkeletonBlock({ width, height, borderRadius = 4, style }: any) {
  const [opacity] = useState(new Animated.Value(0.3));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E0E0E0',
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <View style={headerStyles.container}>
      <SkeletonBlock width={150} height={28} borderRadius={6} style={headerStyles.greeting} />
      <View style={headerStyles.card}>
        <View style={headerStyles.row}>
          <SkeletonBlock width={64} height={64} borderRadius={32} />
          <View style={headerStyles.infoBlock}>
            <SkeletonBlock width={180} height={24} borderRadius={4} style={{ marginBottom: 8 }} />
            <SkeletonBlock width={120} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonBlock width={150} height={16} borderRadius={4} />
          </View>
        </View>
        <SkeletonBlock width={120} height={36} borderRadius={Radius.md} />
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  infoBlock: {
    flex: 1,
    justifyContent: 'center',
  },
});

export function SummaryCardSkeleton() {
  return (
    <View style={summaryStyles.container}>
      <View style={summaryStyles.row}>
        <View style={summaryStyles.card}>
          <SkeletonBlock width={40} height={40} borderRadius={Radius.md} style={{ marginBottom: Spacing.sm }} />
          <SkeletonBlock width={30} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
          <SkeletonBlock width={80} height={14} borderRadius={4} />
        </View>
        <View style={summaryStyles.gap} />
        <View style={summaryStyles.card}>
          <SkeletonBlock width={40} height={40} borderRadius={Radius.md} style={{ marginBottom: Spacing.sm }} />
          <SkeletonBlock width={30} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
          <SkeletonBlock width={80} height={14} borderRadius={4} />
        </View>
      </View>
      <View style={summaryStyles.rowGap} />
      <View style={summaryStyles.row}>
        <View style={summaryStyles.card}>
          <SkeletonBlock width={40} height={40} borderRadius={Radius.md} style={{ marginBottom: Spacing.sm }} />
          <SkeletonBlock width={30} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
          <SkeletonBlock width={80} height={14} borderRadius={4} />
        </View>
        <View style={summaryStyles.gap} />
        <View style={summaryStyles.card}>
          <SkeletonBlock width={40} height={40} borderRadius={Radius.md} style={{ marginBottom: Spacing.sm }} />
          <SkeletonBlock width={30} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
          <SkeletonBlock width={80} height={14} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gap: {
    width: Spacing.md,
  },
  rowGap: {
    height: Spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
});

export function SettingsSectionSkeleton() {
  return (
    <View style={settingsStyles.container}>
      <SkeletonBlock width={100} height={16} borderRadius={4} style={settingsStyles.title} />
      <View style={settingsStyles.card}>
        {[1, 2, 3].map((item, index) => (
          <View key={item} style={[settingsStyles.row, index !== 2 && settingsStyles.borderBottom]}>
            <SkeletonBlock width={36} height={36} borderRadius={18} style={{ marginRight: Spacing.md }} />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <SkeletonBlock width={120} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
              <SkeletonBlock width={160} height={12} borderRadius={4} />
            </View>
            <SkeletonBlock width={20} height={20} borderRadius={10} />
          </View>
        ))}
      </View>
    </View>
  );
}

const settingsStyles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  card: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
});
