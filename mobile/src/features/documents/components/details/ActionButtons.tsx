import React, { memo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';

type ActionType = 'edit' | 'share' | 'download' | 'delete';

interface ActionButtonsProps {
  onDelete: () => void;
  onDownload: () => void;
  isDeleting: boolean;
  isDownloading: boolean;
  canDownload: boolean;
}

/** Bottom action bar with Edit, Share, Download, and Delete. */
export const ActionButtons = memo<ActionButtonsProps>(
  ({ onDelete, onDownload, isDeleting, isDownloading, canDownload }) => {
    const handleComingSoon = (action: ActionType) => {
      Alert.alert(
        'Coming Soon',
        `The ${action} feature will be available in a future update.`
      );
    };

    const disabled = isDeleting || isDownloading;

    return (
      <View style={styles.container}>
        {/* Row 1: Edit + Share (placeholders) */}
        <View style={styles.row}>
          <ActionBtn
            icon="create-outline"
            label="Edit"
            color="#1977F3"
            bgColor="#EEF4FF"
            borderColor="#BFDBFE"
            onPress={() => handleComingSoon('edit')}
            disabled={disabled}
          />
          <View style={styles.gap} />
          <ActionBtn
            icon="share-social-outline"
            label="Share"
            color="#1977F3"
            bgColor="#EEF4FF"
            borderColor="#BFDBFE"
            onPress={() => handleComingSoon('share')}
            disabled={disabled}
          />
        </View>

        {/* Row 2: Download + Delete */}
        <View style={[styles.row, styles.rowTop]}>
          <ActionBtn
            icon="download-outline"
            label="Download"
            color={Colors.white}
            bgColor="#1E1E1E"
            borderColor="#1E1E1E"
            onPress={onDownload}
            disabled={disabled || !canDownload}
            loading={isDownloading}
          />
          <View style={styles.gap} />
          <ActionBtn
            icon="trash-outline"
            label="Delete"
            color="#D32F2F"
            bgColor="#FFF0F0"
            borderColor="#FFCDD2"
            onPress={onDelete}
            disabled={disabled}
            loading={isDeleting}
          />
        </View>
      </View>
    );
  }
);

ActionButtons.displayName = 'ActionButtons';

// ── Private helper ─────────────────────────────────────────────────────────────

interface ActionBtnProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const ActionBtn = memo<ActionBtnProps>(
  ({ icon, label, color, bgColor, borderColor, onPress, disabled, loading }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bgColor, borderColor },
        pressed && styles.btnPressed,
        disabled && styles.btnDisabled,
      ]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={color}
          style={styles.btnIcon}
        />
      ) : (
        <Ionicons name={icon} size={18} color={color} style={styles.btnIcon} />
      )}
      <Text style={[styles.btnLabel, { color }]}>{label}</Text>
    </Pressable>
  )
);

ActionBtn.displayName = 'ActionBtn';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
  rowTop: {
    marginTop: Spacing.sm,
  },
  gap: {
    width: Spacing.sm,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: Radius.button,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnIcon: {
    marginRight: 6,
  },
  btnLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    fontFamily: Typography.fontFamilies.sans,
  },
});
