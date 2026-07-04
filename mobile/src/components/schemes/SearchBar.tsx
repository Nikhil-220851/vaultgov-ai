"use no memo";
import React, { useRef } from 'react';
import {
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search schemes...',
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);
  const borderColorProgress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: borderColorProgress.value === 1 ? colors.primary : '#E5E5EA',
  }));

  const handleFocus = () => {
    borderColorProgress.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    borderColorProgress.value = withTiming(0, { duration: 200 });
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Ionicons name="search-outline" size={18} color={colors.darkGray} style={styles.searchIcon} />
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A0A0A0"
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          style={styles.clearButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={18} color="#A0A0A0" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: Radius.button,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    paddingHorizontal: Spacing.md,
    height: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.black,
    fontWeight: '400',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  clearButton: {
    paddingLeft: Spacing.xs,
  },
});
