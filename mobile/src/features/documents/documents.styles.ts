import { StyleSheet, Platform, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8F5', // Matches colors.background from home feature
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  
  // Header section
  headerTitle: {
    fontSize: 28,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
    color: Colors.pureBlack,
    letterSpacing: -0.5,
  },
  avatarPressable: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...(Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }) as ViewStyle),
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.sans,
    color: Colors.darkGray,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFEFEF', // Rounded light gray pill
    borderRadius: Radius.full,
    height: 48,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamilies.sans,
    color: Colors.pureBlack,
  },

  // Category Filter
  categoriesContainer: {
    marginBottom: Spacing.md,
  },


  // Documents List
  listContent: {
    paddingBottom: 120, // Sufficient bottom padding to clear floating action button and tab bar
  },

  // Document Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...(Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }) as ViewStyle),
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
    color: Colors.pureBlack,
  },
  cardSubtitle: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamilies.sans,
    color: Colors.darkGray,
    marginTop: 2,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.sans,
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.pureBlack,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }) as ViewStyle),
  },
});
