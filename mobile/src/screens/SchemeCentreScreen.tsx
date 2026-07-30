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
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  BASE_SCHEMES_DATA,
  Scheme,
  AppliedScheme,
  getApplicationStatusColor,
  getApplicationStatusLabel,
} from '@/data/schemes';
import { useUser } from '@/context/UserContext';
import { useDocumentStore } from '@/features/documents/store/useDocumentStore';
import { SchemeDatabase } from '@/services/schemes/SchemeDatabase';
import { SchemeRepository } from '@/services/schemes/SchemeRepository';
import { SchemeRecord } from '@/services/schemes/types';
import { SchemeCard } from '@/components/schemes/SchemeCard';
import { SearchBar } from '@/components/SearchBar';
import { AppHeader } from '@/components/AppHeader';
import { PageContainer } from '@/components/PageContainer';
import { FilterBottomSheet, SchemeFilter, DEFAULT_FILTER } from '@/components/schemes/FilterBottomSheet';
import { ApplicationProgress } from '@/components/schemes/ApplicationProgress';
import { colors } from '@/theme/colors';
import { Colors, Spacing, Typography } from '@/theme';
import { schemeSyncService } from '@/services/schemes/SchemeSyncService';

type Tab = 'eligible' | 'applied' | 'saved';

const STORAGE_KEYS = {
  saved: 'vaultgov_saved_scheme_ids',
  applied: 'vaultgov_applied_schemes',
};

export function SchemeCentreScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { documents } = useDocumentStore();
  const [activeTab, setActiveTab] = useState<Tab>('eligible');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<SchemeFilter>(DEFAULT_FILTER);
  const [filterVisible, setFilterVisible] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [appliedSchemes, setAppliedSchemes] = useState<AppliedScheme[]>([]);
  const [dbSchemes, setDbSchemes] = useState<SchemeRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Track mount status ────────────────────────────────────────────────────
  const isMountedRef = React.useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSavedIds = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.saved);
        if (isMounted && stored) setSavedIds(JSON.parse(stored));
      } catch {
        // silent fail
      }
    };

    const loadAppliedSchemes = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.applied);
        if (isMounted && stored) {
          const parsed = JSON.parse(stored) as AppliedScheme[];
          setAppliedSchemes(parsed);
        }
      } catch {
        // silent fail
      }
    };

    const loadDbSchemes = async () => {
      try {
        await SchemeDatabase.initDatabase();
        const active = await SchemeDatabase.getActiveSchemes();
        if (isMounted) setDbSchemes(active);
      } catch {
        // silent fail
      }
    };

    loadSavedIds();
    loadAppliedSchemes();
    loadDbSchemes();

    return () => {
      isMounted = false;
    };
  }, []);

  const reloadDbSchemes = useCallback(async () => {
    try {
      await SchemeDatabase.initDatabase();
      const active = await SchemeDatabase.getActiveSchemes();
      if (isMountedRef.current) {
        setDbSchemes(active);
      }
    } catch {
      // silent fail
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await schemeSyncService.sync('manual');
      if (isMountedRef.current) {
        await reloadDbSchemes();
        Alert.alert(
          result.success ? 'Schemes Updated' : 'Sync Failed',
          result.message,
          [{ text: 'OK' }]
        );
      }
    } catch {
      if (isMountedRef.current) {
        Alert.alert('Sync Failed', 'Could not refresh schemes. Please try again.', [{ text: 'OK' }]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [reloadDbSchemes]);

  const toggleSave = useCallback(async (schemeId: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(schemeId)
        ? prev.filter((id) => id !== schemeId)
        : [...prev, schemeId];
      AsyncStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(next)).catch(() => null);
      return next;
    });
  }, []);

  const handleTabPress = (tab: Tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  // ─── Filtered Schemes ───────────────────────────────────────────────────────

  const evaluatedSchemes = React.useMemo(() => {
    const sourceList = dbSchemes.length > 0 ? dbSchemes : BASE_SCHEMES_DATA;
    return sourceList.map((record) => SchemeRepository.evaluateScheme(record as any, user, documents));
  }, [dbSchemes, user, documents]);

  const eligibleSchemes = React.useMemo(() => {
    return evaluatedSchemes.filter(
      (s) => s.eligibilityStatus === 'eligible' || s.eligibilityStatus === 'partially_eligible'
    );
  }, [evaluatedSchemes]);

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

  const savedSchemes = React.useMemo(() => {
    return evaluatedSchemes.filter((s) => savedIds.includes(s.id));
  }, [evaluatedSchemes, savedIds]);
  
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
    const scheme = evaluatedSchemes.find((s) => s.id === item.schemeId);
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
    <PageContainer noPadding>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* ─── Sticky Header ─────────────────────────────────────────────── */}
      <AppHeader
        title="Scheme Centre"
        subtitle="Government Benefits"
        rightElement={
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
        }
        borderBottomColor="transparent"
      />

      <View style={styles.header}>
        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* Tab Pills */}
        <View style={{ paddingHorizontal: 24, marginBottom: Spacing.sm }}>
          <SegmentedTabs
            tabs={['Eligible', 'Applied', 'Saved']}
            activeTab={activeTab === 'eligible' ? 'Eligible' : activeTab === 'applied' ? 'Applied' : 'Saved'}
            onChangeTab={(tab) => {
              const tabKey = tab === 'Eligible' ? 'eligible' : tab === 'Applied' ? 'applied' : 'saved';
              handleTabPress(tabKey);
            }}
            badges={{
              Eligible: filteredEligible.length,
              Applied: appliedSchemes.length,
              Saved: savedIds.length,
            }}
          />
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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={filterVisible}
        filter={filter}
        onApply={(f) => setFilter(f)}
        onClose={() => setFilterVisible(false)}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    paddingHorizontal: 24,
    marginBottom: Spacing.md,
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
