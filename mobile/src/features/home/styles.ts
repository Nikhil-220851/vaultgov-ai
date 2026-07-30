import { StyleSheet, Platform, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F5', // Matched background from colors
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Spacing.md,
  },
  
  // Header Component
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  logoText: {
    fontSize: 24,
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

  // Greeting Component
  greetingContainer: {
    marginBottom: Spacing.lg,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
    color: Colors.pureBlack,
    marginBottom: Spacing.xs,
  },
  dateText: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
  },

  // Health Score Card
  healthCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    ...(Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }) as ViewStyle),
  },
  healthCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  healthIconBg: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  healthCardHeaderText: {
    flex: 1,
  },
  healthCardTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    fontFamily: Typography.fontFamilies.heading,
    color: Colors.pureBlack,
  },
  healthCardSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
    marginTop: 2,
  },
  healthCardDivider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginBottom: Spacing.md,
  },
  healthCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthCardBodyRight: {
    flex: 1,
    paddingLeft: Spacing.md,
    justifyContent: 'center',
  },
  statusBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    fontFamily: Typography.fontFamilies.sans,
    color: Colors.darkGray,
    marginRight: Spacing.sm,
  },

  // Circular Score
  circularContainer: {
    width: 90,
    height: 90,
    borderRadius: Radius.full,
    borderWidth: 6,
    borderColor: '#EAEAEA', // base track circle color
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circularProgressOverlay: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: Radius.full,
    borderWidth: 6,
    borderColor: '#4CD964', // success color or standard circular border
    // React Native does not easily draw partial borders unless styled properly. 
    // We will build a neat custom CSS border or overlay.
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
    color: Colors.pureBlack,
  },
  scoreTotal: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
    marginTop: 1,
  },

  // Progress Bar
  progressBarTrack: {
    height: 6,
    backgroundColor: '#EAEAEA',
    borderRadius: Radius.full,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.pureBlack,
    borderRadius: Radius.full,
  },

  // Overview section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryBlue,
    letterSpacing: 1.2,
    fontFamily: Typography.fontFamilies.heading,
  },
  sectionTitleDark: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.darkGray,
    letterSpacing: 1.2,
    fontFamily: Typography.fontFamilies.heading,
  },
  seeAllText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryBlue,
    fontFamily: Typography.fontFamilies.sans,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderStyle: 'dashed',
    ...(Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }) as ViewStyle),
  },
  overviewCardFirst: {
    marginRight: Spacing.xs,
  },
  overviewCardLast: {
    marginLeft: Spacing.xs,
  },
  overviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  overviewCardCount: {
    fontSize: 24,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    fontFamily: Typography.fontFamilies.heading,
    marginBottom: 2,
  },
  overviewCardLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
  },

  // Alert Card
  alertCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
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
  alertIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  alertContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  alertTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
    fontFamily: Typography.fontFamilies.heading,
  },
  alertExpiry: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
    marginTop: 2,
  },
  alertBadge: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
    fontFamily: Typography.fontFamilies.sans,
  },

  // Scheme Card
  schemeCard: {
    backgroundColor: '#F2FCF4', // light success green background
    borderWidth: 1,
    borderColor: '#34C759', // primaryGreen
    borderRadius: Radius.card,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
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
  schemeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2F6E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  schemeContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  schemeTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    fontFamily: Typography.fontFamilies.heading,
  },
  schemeDescription: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
    marginTop: 2,
  },
  schemeBadge: {
    backgroundColor: '#E2F6E7',
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  schemeBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: '#34C759',
    fontFamily: Typography.fontFamilies.sans,
  },

  // Quick Action Card
  quickActionCard: {
    backgroundColor: '#F1F5FE', // soft tint blue background
    borderWidth: 1,
    borderColor: '#D4E2FD',
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...(Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }) as ViewStyle),
  },
  quickActionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryBlue,
    fontFamily: Typography.fontFamilies.heading,
  },
  quickActionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
    marginTop: 2,
  },
  chevronContainer: {
    paddingLeft: Spacing.sm,
  },
});
