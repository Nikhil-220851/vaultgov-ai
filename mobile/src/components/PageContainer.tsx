import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Colors } from '@/theme';

interface PageContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  edges?: Edge[];
  noPadding?: boolean;
}

export function PageContainer({
  children,
  style,
  backgroundColor = Colors.background,
  edges = ['top', 'left', 'right'],
  noPadding = false,
}: PageContainerProps) {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={edges}>
      <View style={[styles.container, style, noPadding ? { padding: 0 } : {}]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
