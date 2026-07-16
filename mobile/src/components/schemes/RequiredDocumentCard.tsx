import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  RequiredDocument,
  DocumentStatus,
  getDocumentStatusColor,
  getDocumentStatusLabel,
} from '@/data/schemes';
import { colors } from '@/theme/colors';
import { Colors, Radius, Spacing, Typography } from '@/theme';

interface RequiredDocumentCardProps {
  document: RequiredDocument;
  onUpload?: (docId: string) => void;
  onView?: (docId: string) => void;
  onReplace?: (docId: string) => void;
}

const STATUS_ICON: Record<DocumentStatus, string> = {
  verified: 'shield-check',
  uploaded: 'check-circle',
  expired: 'clock-alert',
  missing: 'file-question',
  optional: 'file-document-outline',
};

export function RequiredDocumentCard({
  document,
  onUpload,
  onView,
  onReplace,
}: RequiredDocumentCardProps) {
  const statusColor = getDocumentStatusColor(document.status);
  const statusLabel = getDocumentStatusLabel(document.status);
  const statusIconName = STATUS_ICON[document.status];

  return (
    <View style={styles.card}>
      {/* Left: Doc Icon */}
      <View style={[styles.docIcon, { backgroundColor: statusColor + '18' }]}>
        <MaterialCommunityIcons
          name={document.iconName as any}
          size={22}
          color={statusColor}
        />
      </View>

      {/* Middle: Name & Description */}
      <View style={styles.content}>
        <Text style={styles.docName} numberOfLines={1}>
          {document.name}
        </Text>
        {document.description ? (
          <Text style={styles.docDesc} numberOfLines={2}>
            {document.description}
          </Text>
        ) : null}

        {/* Status Chip */}
        <View style={[styles.statusChip, { backgroundColor: statusColor + '18' }]}>
          <MaterialCommunityIcons name={statusIconName as any} size={11} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Right: Action Button(s) */}
      <View style={styles.actions}>
        {document.status === 'missing' && onUpload && (
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => onUpload(document.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={14} color={colors.white} />
            <Text style={styles.uploadText}>Upload</Text>
          </TouchableOpacity>
        )}
        {document.status === 'expired' && (
          <TouchableOpacity
            style={[styles.uploadBtn, styles.expiredBtn]}
            onPress={() => onReplace?.(document.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={14} color={colors.white} />
            <Text style={styles.uploadText}>Renew</Text>
          </TouchableOpacity>
        )}
        {(document.status === 'uploaded' || document.status === 'verified') && (
          <View style={styles.readyActions}>
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => onView?.(document.id)}
              activeOpacity={0.8}
            >
              <Ionicons name="eye-outline" size={14} color={colors.primary} />
            </TouchableOpacity>
            {document.status !== 'verified' && (
              <TouchableOpacity
                style={styles.replaceBtn}
                onPress={() => onReplace?.(document.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="swap-horizontal" size={14} color={Colors.darkGray} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  docName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: colors.black,
    marginBottom: 3,
  },
  docDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    lineHeight: 15,
    marginBottom: 6,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
  },
  actions: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.button,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  expiredBtn: {
    backgroundColor: '#FF9800',
  },
  uploadText: {
    fontSize: 12,
    fontWeight: Typography.weights.semibold,
    color: colors.white,
  },
  readyActions: {
    flexDirection: 'row',
    gap: 6,
  },
  viewBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replaceBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
