import { StyleSheet, Platform } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // #F8F8F8
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    width: '100%',
  },
  // Icon card container
  logoCard: {
    width: 90,
    height: 90,
    backgroundColor: '#F2F2F7', // Slightly off-white light gray background
    borderRadius: Radius.card, // 24px
    borderWidth: 1,
    borderColor: '#E5E5EA', // Subtle border
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: Colors.pureBlack,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  // Custom building icon drawn via pure React Native Views
  buildingIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildingRoof: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.primaryOrange, // Accent color: Primary Orange
  },
  buildingArchitrave: {
    width: 36,
    height: 3,
    backgroundColor: Colors.darkGray,
    marginTop: 1,
    borderRadius: 1,
  },
  buildingColumnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 28,
    height: 14,
    marginVertical: 2,
  },
  buildingColumn: {
    width: 3.5,
    height: 14,
    backgroundColor: Colors.darkGray,
    borderRadius: 1,
  },
  buildingBaseTop: {
    width: 38,
    height: 3,
    backgroundColor: Colors.darkGray,
    borderRadius: 1,
  },
  buildingBaseBottom: {
    width: 42,
    height: 3,
    backgroundColor: Colors.darkGray,
    borderRadius: 1,
    marginTop: 1,
  },
  // Typography
  title: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: 24, // Premium bold title
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.sm, // 14px
    fontWeight: Typography.weights.medium,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.sm, // 20px
    maxWidth: 260,
  },
  // Auth Buttons Section
  buttonSection: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  authButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E5EA', // Thin gray border
    borderRadius: 18, // Rounded 18px
    height: 64, // Premium vertical size
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.pureBlack,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.03)',
      },
    }),
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F2F7', // Off-white badge background
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 48, // To visually center the text against the left badge
  },
  authButtonText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.md, // 16px
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
    textAlign: 'center',
  },
  arrowContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    width: '100%',
    paddingHorizontal: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.sm,
    color: '#8E8E93', // Muted gray
    paddingHorizontal: Spacing.md,
  },
  // Footer
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  footerText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.xs, // 12px
    color: '#8E8E93', // Muted gray
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  footerLink: {
    opacity: 1,
  },
  footerLinkText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.xs,
    color: '#666666', // Muted gray
    fontWeight: Typography.weights.semibold,
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.xs,
    color: '#8E8E93',
    marginHorizontal: 6,
  },
});
