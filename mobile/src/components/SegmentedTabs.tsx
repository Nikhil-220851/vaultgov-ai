"use no memo";
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { Spacing, Typography, Radius } from '@/theme';

interface SegmentedTabsProps {
  tabs: string[];
  activeTab: string;
  onChangeTab: (tab: string, index: number) => void;
  scrollable?: boolean;
  badges?: Record<string, number>;
}

export function SegmentedTabs({
  tabs,
  activeTab,
  onChangeTab,
  scrollable = false,
  badges,
}: SegmentedTabsProps) {
  return (
    <View style={styles.container}>
      {scrollable ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {tabs.map((tab, index) => (
            <TabItem
              key={tab}
              label={tab}
              isActive={activeTab === tab}
              badge={badges ? badges[tab] : undefined}
              onPress={() => onChangeTab(tab, index)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.staticContent}>
          {tabs.map((tab, index) => (
            <TabItem
              key={tab}
              label={tab}
              isActive={activeTab === tab}
              badge={badges ? badges[tab] : undefined}
              onPress={() => onChangeTab(tab, index)}
              flexStyle={styles.flexItem}
            />
          ))}
        </View>
      )}
    </View>
  );
}

interface TabItemProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  badge?: number;
  flexStyle?: any;
}

function TabItem({ label, isActive, onPress, badge, flexStyle }: TabItemProps) {
  const [bgAnim] = useState(() => new Animated.Value(isActive ? 1 : 0));

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isActive ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [isActive, bgAnim]);

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#000000'],
  });

  const borderColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E6E6E6', '#000000'],
  });

  const textColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#707070', '#FFFFFF'],
  });

  const badgeBgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E5EA', '#FFFFFF'],
  });

  const badgeTextColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#707070', '#000000'],
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      style={[styles.pressable, flexStyle]}
    >
      <Animated.View style={[styles.tab, { backgroundColor, borderColor }]}>
        <View style={styles.tabContentRow}>
          <Animated.Text style={[styles.tabText, { color: textColor }]}>
            {label}
          </Animated.Text>
          {badge !== undefined && badge > 0 ? (
            <Animated.View style={[styles.badge, { backgroundColor: badgeBgColor }]}>
              <Animated.Text style={[styles.badgeText, { color: badgeTextColor }]}>
                {badge}
              </Animated.Text>
            </Animated.View>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xs,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingRight: Spacing.md,
  },
  staticContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flexItem: {
    flex: 1,
  },
  pressable: {
    marginRight: 4,
  },
  tab: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    fontFamily: Typography.fontFamilies.sans,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
});
