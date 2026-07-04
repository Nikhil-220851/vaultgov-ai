"use no memo";
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  SCHEMES,
  Scheme,
  AppliedScheme,
  getApplicationStatusColor,
  getApplicationStatusLabel,
} from '@/data/schemes';
import { SchemeCard } from '@/components/schemes/SchemeCard';
import { SearchBar } from '@/components/schemes/SearchBar';
import { FilterBottomSheet, SchemeFilter, DEFAULT_FILTER } from '@/components/schemes/FilterBottomSheet';
import { ApplicationProgress } from '@/components/schemes/ApplicationProgress';
import { colors } from '@/theme/colors';
import { Colors, Spacing, Typography } from '@/theme';

type Tab = 'eligible' | 'applied' | 'saved';

const STORAGE_KEYS = {
  saved: 'vaultgov_saved_scheme_ids',
  applied: 'vaultgov_applied_schemes',
};

const MOCK_APPLIED: AppliedScheme[] = [
  {
    schemeId: 'scheme-003',
    applicationId: 'VG-2026-004521',
    applicationDate: 'Jul 1, 2026',
    status: 'under_review',
    submittedAt: 'Jul 1, 2026',
  },
  {
    schemeId: 'scheme-005',
    applicationId: 'VG-2026-003874',
    applicationDate: 'Jun 18, 2026',
    status: 'submitted',
    submittedAt: 'Jun 18, 2026',
  },
];

export function SchemeCentreScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('eligible');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<SchemeFilter>(DEFAULT_FILTER);
  const [filterVisible, setFilterVisible] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [appliedSchemes, setAppliedSchemes] = useState<AppliedScheme[]>(MOCK_APPLIED);

  // Tab indicator animation
  const tabIndicatorX = useSharedValue(0);
  const TAB_WIDTH = 110;

  useEffect(() => {
    const loadSavedIds = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.saved);
        if (stored) setSavedIds(JSON.parse(stored));
      } catch {
        // silent fail
      }
    };

    const loadAppliedSchemes = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.applied);
        if (stored) {
          const parsed = JSON.parse(stored) as AppliedScheme[];
          setAppliedSchemes([...MOCK_APPLIED, ...parsed]);
        }
      } catch {
        // silent fail
      }
    };

    loadSavedIds();
    loadAppliedSchemes();
  }, []);

  const toggleSave = useCallback(async (schemeId: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(schemeId)
        ? prev.filter((id) => id !== schemeId)
        : [...prev, schemeId];
      AsyncStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(next)).catch(() => null);
      return next;
    });
  }, []);

  const handleTabPress = (tab: Tab, index: number) => {
    setActiveTab(tab);
    tabIndicatorX.value = withTiming(index * TAB_WIDTH, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
    setSearchQuery('');
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorX.value }],
  }));

  // ─── Filtered Schemes ───────────────────────────────────────────────────────

  const eligibleSchemes = SCHEMES.filter(
    (s) => s.eligibilityStatus === 'eligible' || s.eligibilityStatus === 'partially_eligible'
  );

  const applyFilters = (schemes: Scheme[]): Scheme[] => {
    let result = [...schemes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.shortTitle.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.ministry.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filter.type !== 'All') {
      result = result.filter((s) => s.type === filter.type);
    }

    if (filter.categories.length > 0) {
      result = result.filter((s) => filter.categories.includes(s.category));
    }

    if (filter.renewable === true) {
      result = result.filter((s) => s.renewable);
    }

    return result;
  };

  const filteredEligible = applyFilters(eligibleSchemes);

  const savedSchemes = SCHEMES.filter((s) => savedIds.includes(s.id));
  const filteredSaved = applyFilters(savedSchemes);

  // ─── Active Filter Count ────────────────────────────────────────────────────
  const activeFilterCount =
    (filter.type !== 'All' ? 1 : 0) +
    filter.categories.length +
    (filter.renewable !== null ? 1 : 0) +
    (filter.deadlineSort !== null ? 1 : 0);

  // ─── Render Helpers ─────────────────────────────────────────────────────────

  const renderSchemeCard = ({ item }: { item: Scheme }) => (
    <SchemeCard
      scheme={item}
      onPress={(s) => router.push(`/schemes/${s.id}` as any)}
      onBookmark={toggleSave}
      isSaved={savedIds.includes(item.id)}
    />
  );

  const renderAppliedItem = ({ item }: { item: AppliedScheme }) => {
    const scheme = SCHEMES.find((s) => s.id === item.schemeId);
    if (!scheme) return null;
    const statusColor = getApplicationStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.appliedCard}
        onPress={() => router.push(`/schemes/${scheme.id}` as any)}
        activeOpacity={0.85}
      >
        <View style={styles.appliedCardTop}>
          <View style={[styles.appliedIcon, { backgroundColor: scheme.accentColor + '20' }]}>
            <Text style={{ color: scheme.accentColor, fontSize: 18 }}>
              {scheme.shortTitle.charAt(0)}
            </Text>
          </View>
          <View style={styles.appliedInfo}>
            <Text style={styles.appliedTitle} numberOfLines={1}>
              {scheme.shortTitle}
            </Text>
            <Text style={styles.appliedId}>{item.applicationId}</Text>
            <Text style={styles.appliedDate}>Applied: {item.applicationDate}</Text>
          </View>
          <View style={[styles.appliedStatusBadge, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.appliedStatusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.appliedStatusText, { color: statusColor }]}>
              {getApplicationStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        <View style={styles.appliedProgressWrap}>
          <ApplicationProgress
            currentStatus={item.status}
            submittedAt={item.submittedAt}
            applicationId={item.applicationId}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSavedItem = ({ item }: { item: Scheme }) => (
    <SchemeCard
      scheme={item}
      onPress={(s) => router.push(`/schemes/${s.id}` as any)}
      onBookmark={toggleSave}
      isSaved={true}
    />
  );

  const renderEmptyState = (tab: Tab) => {
    const configs = {
      eligible: {
        icon: 'checkmark-circle-outline' as const,
        title: 'No eligible schemes found',
        subtitle:
          searchQuery
            ? `No results for "${searchQuery}". Try a different search.`
            : 'No schemes match your current filters. Try resetting them.',
      },
      applied: {
        icon: 'document-text-outline' as const,
        title: 'No applications yet',
        subtitle: 'Apply to eligible schemes and track your progress here.',
      },
      saved: {
        icon: 'bookmark-outline' as const,
        title: 'No saved schemes',
        subtitle: 'Bookmark schemes you want to apply later.',
      },
    };
    const cfg = configs[tab];
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name={cfg.icon} size={44} color={Colors.darkGray} />
        </View>
        <Text style={styles.emptyTitle}>{cfg.title}</Text>
        <Text style={styles.emptySubtitle}>{cfg.subtitle}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* ─── Sticky Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.pretitle}>Government Benefits</Text>
            <Text style={styles.title}>Scheme Centre</Text>
          </View>
          <View style={styles.headerActions}>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setFilterVisible(true)}
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="options-outline" size={22} color={colors.black} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* Tab Pills */}
        <View style={styles.tabContainer}>
          <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
          {(['eligible', 'applied', 'saved'] as Tab[]).map((tab, index) => {
            const labels: Record<Tab, string> = {
              eligible: 'Eligible',
              applied: 'Applied',
              saved: 'Saved',
            };
            const counts: Record<Tab, number | null> = {
              eligible: filteredEligible.length,
              applied: appliedSchemes.length,
              saved: savedIds.length,
            };
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, { width: TAB_WIDTH }]}
                onPress={() => handleTabPress(tab, index)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {labels[tab]}
                </Text>
                {counts[tab] !== null && counts[tab]! > 0 && (
                  <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                      {counts[tab]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── Content ───────────────────────────────────────────────────── */}
      {activeTab === 'eligible' && (
        <FlatList
          data={filteredEligible}
          keyExtractor={(item) => item.id}
          renderItem={renderSchemeCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => renderEmptyState('eligible')}
        />
      )}

      {activeTab === 'applied' && (
        <FlatList
          data={appliedSchemes}
          keyExtractor={(item) => item.applicationId}
          renderItem={renderAppliedItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => renderEmptyState('applied')}
        />
      )}

      {activeTab === 'saved' && (
        <FlatList
          data={filteredSaved}
          keyExtractor={(item) => item.id}
          renderItem={renderSavedItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => renderEmptyState('saved')}
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={filterVisible}
        filter={filter}
        onApply={(f) => setFilter(f)}
        onClose={() => setFilterVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: colors.background,
    paddingTop: Spacing.md,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  pretitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: Typography.weights.bold,
    color: colors.black,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: colors.white,
  },
  searchWrap: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  // ── Tabs ────────────────────────────────────────────────────────────────────
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F5',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 12,
    padding: 3,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 110,
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    gap: 5,
    zIndex: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: Typography.weights.medium,
    color: Colors.darkGray,
  },
  tabTextActive: {
    color: colors.black,
    fontWeight: Typography.weights.semibold,
  },
  tabCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 99,
    backgroundColor: '#E5E5EA',
    minWidth: 20,
    alignItems: 'center',
  },
  tabCountActive: {
    backgroundColor: colors.primary + '20',
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.darkGray,
  },
  tabCountTextActive: {
    color: colors.primary,
  },
  // ── List ────────────────────────────────────────────────────────────────────
  listContent: {
    paddingTop: Spacing.md,
    paddingBottom: 32,
  },
  // ── Applied Card ────────────────────────────────────────────────────────────
  appliedCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  appliedCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  appliedIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  appliedInfo: {
    flex: 1,
    marginRight: 8,
  },
  appliedTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: colors.black,
    marginBottom: 3,
  },
  appliedId: {
    fontSize: Typography.sizes.xs,
    color: colors.primary,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  appliedDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
  },
  appliedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    gap: 4,
    alignSelf: 'flex-start',
  },
  appliedStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  appliedStatusText: {
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
  },
  appliedProgressWrap: {
    marginTop: 2,
  },
  // ── Empty State ─────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: colors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
