"use no memo";
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { Colors, Radius, Spacing, Typography } from '@/theme';

export type SchemeFilter = {
  type: 'All' | 'Central' | 'State';
  categories: string[];
  renewable: boolean | null;
  deadlineSort: 'asc' | 'desc' | null;
};

export const DEFAULT_FILTER: SchemeFilter = {
  type: 'All',
  categories: [],
  renewable: null,
  deadlineSort: null,
};

const CATEGORIES = [
  'Education',
  'Agriculture',
  'Health',
  'Housing',
  'Skill Development',
  'Technology',
  'Women & Child',
  'Pension',
];

interface FilterBottomSheetProps {
  visible: boolean;
  filter: SchemeFilter;
  onApply: (filter: SchemeFilter) => void;
  onClose: () => void;
}

export function FilterBottomSheet({
  visible,
  filter,
  onApply,
  onClose,
}: FilterBottomSheetProps) {
  const translateY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);
  const [localFilter, setLocalFilter] = useState<SchemeFilter>(filter);

  // Reset local filter when bottom sheet opens
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setLocalFilter(filter);
    }
  }

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 22, stiffness: 220 });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withSpring(600, { damping: 22, stiffness: 220 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, backdropOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleApply = () => {
    onApply(localFilter);
    onClose();
  };

  const handleReset = () => {
    setLocalFilter(DEFAULT_FILTER);
  };

  const toggleCategory = (cat: string) => {
    setLocalFilter((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const activeFilterCount =
    (localFilter.type !== 'All' ? 1 : 0) +
    localFilter.categories.length +
    (localFilter.renewable !== null ? 1 : 0) +
    (localFilter.deadlineSort !== null ? 1 : 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Filter Schemes</Text>
              {activeFilterCount > 0 && (
                <Text style={styles.activeCount}>
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.black} />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Scheme Type */}
            <Text style={styles.sectionLabel}>Scheme Type</Text>
            <View style={styles.chipRow}>
              {(['All', 'Central', 'State'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    localFilter.type === type && styles.chipSelected,
                  ]}
                  onPress={() => setLocalFilter((prev) => ({ ...prev, type }))}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipText,
                      localFilter.type === type && styles.chipTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    localFilter.categories.includes(cat) && styles.chipSelected,
                  ]}
                  onPress={() => toggleCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipText,
                      localFilter.categories.includes(cat) && styles.chipTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Renewable */}
            <View style={styles.switchRow}>
              <View style={styles.switchTextGroup}>
                <Text style={styles.sectionLabel}>Renewable Only</Text>
                <Text style={styles.switchSubtext}>
                  Show schemes that can be renewed annually
                </Text>
              </View>
              <Switch
                value={localFilter.renewable === true}
                onValueChange={(v) =>
                  setLocalFilter((prev) => ({ ...prev, renewable: v ? true : null }))
                }
                trackColor={{ false: '#E5E5EA', true: colors.primary }}
                thumbColor={Platform.OS === 'android' ? colors.white : undefined}
                ios_backgroundColor="#E5E5EA"
              />
            </View>

            {/* Deadline Sort */}
            <Text style={styles.sectionLabel}>Sort by Deadline</Text>
            <View style={styles.chipRow}>
              {[
                { label: 'Earliest First', value: 'asc' as const },
                { label: 'Latest First', value: 'desc' as const },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.chip,
                    localFilter.deadlineSort === opt.value && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setLocalFilter((prev) => ({
                      ...prev,
                      deadlineSort: prev.deadlineSort === opt.value ? null : opt.value,
                    }))
                  }
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipText,
                      localFilter.deadlineSort === opt.value && styles.chipTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.bottomPad} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.75}>
              <Text style={styles.resetText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 99,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: colors.black,
  },
  activeCount: {
    fontSize: Typography.sizes.xs,
    color: colors.primary,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: colors.darkGray,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#F5F5F7',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#EBF2FF',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: Typography.weights.medium,
    color: Colors.darkGray,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: 4,
  },
  switchTextGroup: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchSubtext: {
    fontSize: Typography.sizes.xs,
    color: colors.darkGray,
    marginTop: 2,
  },
  bottomPad: {
    height: 24,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.md,
  },
  resetBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.button,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  resetText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.darkGray,
  },
  applyBtn: {
    flex: 2,
    height: 52,
    borderRadius: Radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  applyText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: colors.white,
  },
});
