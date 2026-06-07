import { StyleSheet, Dimensions } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Keep card size responsive and centered
export const CARD_WIDTH = Math.min(screenWidth - Spacing.xl * 2, 420);
export const CARD_HEIGHT = Math.min(screenHeight * 0.65, 520);
export const SLIDE_WIDTH = screenWidth;

export const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background, // #F8F8F8
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: Colors.white,
    borderRadius: Radius.card, // 24px
    padding: Spacing.lg,
    justifyContent: 'space-between',
    alignItems: 'center',
    // Soft premium shadow
    shadowColor: Colors.pureBlack,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 4,
  },
  slideWrapper: {
    width: SLIDE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationArea: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.background, // light gray background for illustration area
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  textContentContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  heading: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: Typography.sizes.xxl, // Large font size
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.xxl,
  },
  description: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.md,
    letterSpacing: 0.2,
    marginTop: Spacing.xs,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: Spacing.md,
    marginTop: Spacing.sm,
  },
  dot: {
    height: 6,
    borderRadius: Radius.full,
    marginHorizontal: 4,
  },
  bottomActionsContainer: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bottomButton: {
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.button, // 14px
  },
  skipButton: {
    backgroundColor: '#F0F0F2',
    paddingHorizontal: Spacing.lg,
  },
  skipText: {
    color: Colors.darkGray,
    fontFamily: Typography.fontFamilies.sans,
    fontWeight: Typography.weights.semibold,
    fontSize: Typography.sizes.sm,
  },
  nextButton: {
    backgroundColor: Colors.pureBlack,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  nextText: {
    color: Colors.white,
    fontFamily: Typography.fontFamilies.sans,
    fontWeight: Typography.weights.semibold,
    fontSize: Typography.sizes.sm,
  },
  nextArrow: {
    color: Colors.white,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  slideInfoText: {
    fontFamily: Typography.fontFamilies.sans,
    color: Colors.darkGray,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
});
