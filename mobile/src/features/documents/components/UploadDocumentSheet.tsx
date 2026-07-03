/**
 * UploadDocumentSheet.tsx
 *
 * Modal bottom sheet rendered as an overlay above the Documents screen.
 * Opens when the floating + button is pressed.
 *
 * - Background screen remains fully intact (no re-render, no state reset).
 * - Uses a Modal so it sits above the tab bar natively.
 * - Sheet slides up from bottom; dim overlay fades in.
 * - Tapping the dim overlay or pressing Android Back closes the sheet.
 * - Uses existing theme tokens throughout.
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
  ViewStyle,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';
import { SelectedFile } from '../upload.service';

interface UploadDocumentSheetProps {
  visible: boolean;
  onClose: () => void;
  onFilePicked: (file: SelectedFile) => void;
  onTakePhoto: () => Promise<void>;
  onUploadPdf: () => Promise<void>;
  onUploadImage: () => Promise<void>;
}

interface UploadOptionProps {
  iconName: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const UploadOption: React.FC<UploadOptionProps> = ({
  iconName,
  title,
  subtitle,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
    style={({ pressed }) => [optionStyles.row, pressed && optionStyles.rowPressed]}
  >
    <View style={optionStyles.iconWell}>
      <Ionicons name={iconName as any} size={22} color={Colors.darkGray} />
    </View>
    <View style={optionStyles.textBlock}>
      <Text style={optionStyles.title}>{title}</Text>
      <Text style={optionStyles.subtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={Colors.darkGray} />
  </Pressable>
);

const optionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  rowPressed: {
    backgroundColor: '#F4F4F4',
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    fontFamily: Typography.fontFamilies.heading,
    color: Colors.pureBlack,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamilies.sans,
    color: Colors.darkGray,
    marginTop: 2,
  },
});

// ─── Main Sheet ──────────────────────────────────────────────────────────────

export const UploadDocumentSheet: React.FC<UploadDocumentSheetProps> = ({
  visible,
  onClose,
  onTakePhoto,
  onUploadPdf,
  onUploadImage,
}) => {
  const insets = useSafeAreaInsets();
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(300)).current;

  // ── Animations ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 22,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, overlayOpacity, sheetTranslateY]);

  // ── Android Back button ──────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true; // consume the event so the screen doesn't pop
    });
    return () => sub.remove();
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"  // we drive our own animations
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Dim overlay — tap to dismiss */}
      <Animated.View
        style={[sheetStyles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet card */}
      <Animated.View
        style={[
          sheetStyles.sheet,
          {
            paddingBottom: Math.max(insets.bottom, Spacing.lg),
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
        // prevent taps on the sheet from bubbling to the overlay dismiss
        pointerEvents="box-none"
      >
        {/* Drag handle */}
        <View style={sheetStyles.handle} />

        <Text style={sheetStyles.sheetTitle}>
          Upload{' '}
          <Text style={sheetStyles.sheetTitleAccent}>document</Text>
        </Text>

        <View style={sheetStyles.divider} />

        <UploadOption
          iconName="camera-outline"
          title="Take photo"
          subtitle="Capture with camera & auto-scan"
          onPress={onTakePhoto}
        />

        <View style={sheetStyles.optionSeparator} />

        <UploadOption
          iconName="document-outline"
          title="Upload PDF"
          subtitle="Import from files or storage"
          onPress={onUploadPdf}
        />

        <View style={sheetStyles.optionSeparator} />

        <UploadOption
          iconName="image-outline"
          title="Upload image"
          subtitle="JPEG, PNG from gallery"
          onPress={onUploadImage}
        />
      </Animated.View>
    </Modal>
  );
};

const sheetStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...(Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }) as ViewStyle),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    alignSelf: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  sheetTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.heading,
    color: Colors.pureBlack,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  sheetTitleAccent: {
    color: Colors.primaryBlue,
  },
  divider: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginBottom: Spacing.xs,
  },
  optionSeparator: {
    height: 1,
    backgroundColor: '#F4F4F4',
    marginHorizontal: Spacing.md,
  },
});

export default UploadDocumentSheet;
