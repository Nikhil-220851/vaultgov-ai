import { StyleSheet, Platform } from 'react-native';
import { Spacing, Typography, Radius } from '@/theme';

// Using the same VaultGov AI design tokens as Splash and Onboarding screens
// Primary Blue: #1977F3  |  Background: #F7F8F5  |  Dark Gray: #707070
const BRAND = {
  primaryBlue: '#1977F3',    // matches colors.primary in SplashScreen / OnboardingScreen
  lavender: '#C8CDE8',       // Secondary Lavender
  background: '#F7F8F5',     // matches colors.background (Splash & Onboarding)
  darkGray: '#707070',       // matches colors.darkGray
  borderSubtle: '#E5E7F0',   // Lavender-tinted subtle border (replaces neutral grey)
  badgeBg: '#EEF1FA',        // Lavender-tinted badge (consistent with brand palette)
  dividerColor: '#D8DCF0',   // Lavender-tinted divider line
  mutedText: '#8E8E99',      // Muted caption text
  white: '#FFFFFF',
  black: '#000000',
};

export const styles = StyleSheet.create({
  // ─── Layout ──────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: BRAND.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,     // 24pt
    paddingVertical: Spacing.xl,       // 32pt
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },

  // ─── Header ──────────────────────────────────────────────────────────────
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,         // 40pt — matches Onboarding spacing
    width: '100%',
  },

  // Icon card — matches AppLogo style from SplashScreen exactly
  logoCard: {
    width: 96,
    height: 96,
    backgroundColor: BRAND.white,
    borderRadius: Radius.card,         // 24px — same as AppLogo container
    borderWidth: 1,
    borderColor: BRAND.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,          // 24pt
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primaryBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 16px rgba(25, 119, 243, 0.08)',
      },
    }),
  },

  // ─── Building icon (purely-visual — keep same shape, update colors) ───────
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
    borderBottomColor: BRAND.primaryBlue, // Was: orange — now matches primary brand
  },
  buildingArchitrave: {
    width: 36,
    height: 3,
    backgroundColor: BRAND.darkGray,     // Was: Colors.darkGray (#666666) → now #707070
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
    backgroundColor: BRAND.darkGray,
    borderRadius: 1,
  },
  buildingBaseTop: {
    width: 38,
    height: 3,
    backgroundColor: BRAND.darkGray,
    borderRadius: 1,
  },
  buildingBaseBottom: {
    width: 42,
    height: 3,
    backgroundColor: BRAND.darkGray,
    borderRadius: 1,
    marginTop: 1,
  },

  // ─── Typography ──────────────────────────────────────────────────────────
  title: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: Typography.sizes.xl,     // 20px — design spec for screen titles
    fontWeight: Typography.weights.bold,
    color: BRAND.black,
    textAlign: 'center',
    marginBottom: Spacing.xs,          // 4pt
  },
  subtitle: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.sm,     // 14px — design spec for subtitles
    fontWeight: Typography.weights.regular,
    color: BRAND.darkGray,             // #707070 — matches Splash/Onboarding darkGray
    textAlign: 'center',
    lineHeight: Typography.lineHeights.sm, // 20pt
    maxWidth: 260,
  },

  // ─── Auth Buttons ────────────────────────────────────────────────────────

  // Primary button (Google — first action): solid Primary Blue, like Onboarding's CTA
  authButton: {
    backgroundColor: BRAND.primaryBlue,
    borderRadius: Radius.button,       // 14px — same as Onboarding button
    height: 58,                        // Consistent height for both buttons
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primaryBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(25, 119, 243, 0.25)',
      },
    }),
  },

  // Secondary button variant (OTP — second action): outlined, lighter
  authButtonSecondary: {
    backgroundColor: BRAND.white,
    borderWidth: 1.5,
    borderColor: BRAND.borderSubtle,
    borderRadius: Radius.button,       // 14px — consistent
    height: 58,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: BRAND.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
      },
    }),
  },

  authButtonDisabled: {
    opacity: 0.65,
  },
  authButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,     // 16pt
  },

  // Icon badge inside the button
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,           // 8px — tighter and cleaner
    backgroundColor: 'rgba(255,255,255,0.18)', // Translucent white on blue primary
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Secondary badge variant (on white button)
  iconBadgeSecondary: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: BRAND.badgeBg,   // Lavender-tinted on white button
    justifyContent: 'center',
    alignItems: 'center',
  },

  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 40, // Balance against 40pt left badge
  },
  authButtonText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.md,     // 16px — design spec for button text
    fontWeight: Typography.weights.semibold,
    color: BRAND.white,                // White text on primary blue button
    textAlign: 'center',
  },
  // Secondary button text variant (dark text on white)
  authButtonTextSecondary: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: BRAND.black,
    textAlign: 'center',
  },
  arrowContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Divider ─────────────────────────────────────────────────────────────
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,        // 24pt vertical separation
    width: '100%',
    paddingHorizontal: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BRAND.dividerColor, // Lavender-tinted divider
  },
  dividerText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.xs,     // 12px caption
    fontWeight: Typography.weights.medium,
    color: BRAND.mutedText,
    paddingHorizontal: Spacing.md,     // 16pt horizontal padding
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // ─── Footer ──────────────────────────────────────────────────────────────
  footer: {
    marginTop: Spacing.xl,             // 32pt top margin
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  footerText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.xs,     // 12px caption — design spec
    fontWeight: Typography.weights.regular,
    color: BRAND.mutedText,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,             // 4pt
  },
  footerLink: {
    opacity: 1,
  },
  footerLinkText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.xs,     // 12px
    color: BRAND.primaryBlue,          // Primary Blue for interactive links
    fontWeight: Typography.weights.semibold,
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.xs,
    color: BRAND.mutedText,
    marginHorizontal: 6,
  },

  // ─── Button section ──────────────────────────────────────────────────────
  buttonSection: {
    width: '100%',
    gap: Spacing.md,                   // 16pt gap between buttons
    marginTop: Spacing.lg,             // 24pt top margin
  },

  // ─── Verification & OTP Layouts ──────────────────────────────────────────
  screenFlexContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: BRAND.background,
  },
  
  // SECTION 1 — HEADER (15-20% height, compact, elegant, visually connected)
  headerSectionGroup: {
    width: '100%',
    backgroundColor: BRAND.white,
    borderBottomWidth: 1.5,
    borderColor: BRAND.borderSubtle,
    paddingTop: Platform.OS === 'ios' ? 16 : 16,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerBrandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTextGroup: {
    marginLeft: 16,
  },
  headerTitle: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: 18,
    fontWeight: Typography.weights.bold,
    color: BRAND.black,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: BRAND.darkGray,
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F7',
  },
  backButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonCompactText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 14,
    fontWeight: Typography.weights.semibold,
    color: BRAND.primaryBlue,
    marginLeft: 8,
  },

  // SECTION 2 — MAIN CONTENT (50-60% height, centered)
  mainContentScroll: {
    flex: 1,
    width: '100%',
  },
  mainContentScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  mainContentInner: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },

  // SECTION 3 — ACTION AREA (20-25% height, anchored at bottom)
  actionAreaGroup: {
    width: '100%',
    backgroundColor: BRAND.white,
    borderTopWidth: 1.5,
    borderColor: BRAND.borderSubtle,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    paddingHorizontal: 24,
    ...Platform.select({
      ios: {
        shadowColor: BRAND.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px -4px 12px rgba(0, 0, 0, 0.03)',
      },
    }),
  },

  // Spacing & Alignments
  screenIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND.badgeBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: BRAND.darkGray,
    alignSelf: 'flex-start',
    marginBottom: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    height: 56,
    borderRadius: Radius.button,
    backgroundColor: BRAND.white,
    borderWidth: 1.5,
    borderColor: BRAND.borderSubtle,
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  phoneInputWrapperFocused: {
    borderColor: BRAND.primaryBlue,
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primaryBlue,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 0 6px rgba(25, 119, 243, 0.25)',
      },
    }),
  },
  phoneInputWrapperError: {
    borderColor: '#FF3B30',
  },
  countryCodeContainer: {
    paddingHorizontal: 16,
    borderRightWidth: 1.5,
    borderRightColor: BRAND.borderSubtle,
    height: '100%',
    justifyContent: 'center',
    backgroundColor: '#F3F5FA',
  },
  countryCodeText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: BRAND.black,
  },
  mobileInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.md,
    color: BRAND.black,
  },
  inputHint: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.xs,
    color: BRAND.mutedText,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  inputHintError: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.xs,
    color: '#FF3B30',
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkboxSquare: {
    width: 24,
    height: 24,
    borderRadius: Radius.xs,
    borderWidth: 2,
    borderColor: BRAND.lavender,
    backgroundColor: BRAND.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: BRAND.primaryBlue,
    borderColor: BRAND.primaryBlue,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.darkGray,
  },
  checkboxLabelLink: {
    color: BRAND.primaryBlue,
    fontWeight: Typography.weights.semibold,
    textDecorationLine: 'underline',
  },

  // ─── Success Banner ──────────────────────────────────────────────────────
  successBanner: {
    alignSelf: 'stretch',
    backgroundColor: '#EDF9EE',        // Very soft Success Green tint
    borderColor: '#3CC556',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successBannerIconContainer: {
    marginRight: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3CC556',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBannerText: {
    flex: 1,
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 12,
    lineHeight: 16,
    color: '#1E632B',                  // Dark Green text
  },
  successBannerBoldText: {
    fontWeight: Typography.weights.bold,
  },

  // ─── OTP Grid Input ──────────────────────────────────────────────────────
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  otpInputBox: {
    width: 40,
    height: 56,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: BRAND.borderSubtle,
    backgroundColor: BRAND.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInputBoxFocused: {
    borderColor: BRAND.primaryBlue,
    borderWidth: 2,
  },
  otpDigit: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: Typography.sizes.xl,     // 20px
    fontWeight: Typography.weights.bold,
    color: BRAND.black,
    textAlign: 'center',
    padding: 0,
    width: '100%',
  },
  otpHiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },

  // ─── Timer Section ───────────────────────────────────────────────────────
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.sm,
    color: BRAND.darkGray,
  },
  timerTime: {
    fontWeight: Typography.weights.bold,
    color: '#FF9800',                  // Accent Orange for timer counting
  },
  resendLink: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: BRAND.primaryBlue,
    textDecorationLine: 'underline',
  },
  resendLinkDisabled: {
    color: BRAND.mutedText,
    textDecorationLine: 'none',
    opacity: 0.5,
  },
});

