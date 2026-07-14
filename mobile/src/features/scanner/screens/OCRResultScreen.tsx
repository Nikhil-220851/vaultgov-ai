/**
 * OCRResultScreen.tsx
 *
 * Displays the full OCR result with:
 *  - Confidence badge (Excellent / Good / Fair / Poor)
 *  - Scrollable editable text lines
 *  - Character / word count
 *  - Copy button
 *  - Retry button
 *  - Continue to Document Review button
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  StatusBar,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';
import { OCRExtractionResult, OCRConfidenceLevel } from '../types/ocr.types';
import { ScannedDocument } from '../types/scanner.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface OCRResultScreenProps {
  result: OCRExtractionResult;
  file: ScannedDocument;
  onRetry: () => void;
  onDiscard: () => void;
  onContinue: (editedLines: string[]) => void;
}

// ─── Confidence Badge ─────────────────────────────────────────────────────────

const CONFIDENCE_COLORS: Record<OCRConfidenceLevel, { bg: string; text: string; border: string }> = {
  Excellent: { bg: '#EAFBEA', text: '#1A9130', border: '#B8EFC0' },
  Good:      { bg: '#EAF3FD', text: '#1565C0', border: '#BDD9F5' },
  Fair:      { bg: '#FFF8E5', text: '#B36800', border: '#FFE3A0' },
  Poor:      { bg: '#FFF0EE', text: '#C62828', border: '#FFCCD0' },
  Unknown:   { bg: '#F4F4F4', text: '#707070', border: '#E0E0E0' },
};

const ConfidenceBadge: React.FC<{ level: OCRConfidenceLevel; score: number }> = ({ level, score }) => {
  const colors = CONFIDENCE_COLORS[level];
  const icons: Record<OCRConfidenceLevel, string> = {
    Excellent: 'checkmark-circle',
    Good: 'thumbs-up',
    Fair: 'alert-circle',
    Poor: 'warning',
    Unknown: 'help-circle',
  };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Ionicons name={icons[level] as any} size={14} color={colors.text} />
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {level} · {score}%
      </Text>
    </View>
  );
};

// ─── Editable Line Row ────────────────────────────────────────────────────────

interface EditableLineProps {
  index: number;
  value: string;
  onChange: (index: number, newValue: string) => void;
}

const EditableLine: React.FC<EditableLineProps> = React.memo(({ index, value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <View style={[styles.lineRow, isEditing && styles.lineRowActive]}>
      <Text style={styles.lineNumber}>{index + 1}</Text>
      <TextInput
        style={styles.lineInput}
        value={value}
        onChangeText={v => onChange(index, v)}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        multiline
        scrollEnabled={false}
        selectionColor={Colors.primaryBlue}
      />
    </View>
  );
});
EditableLine.displayName = 'EditableLine';

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const OCRResultScreen: React.FC<OCRResultScreenProps> = ({
  result,
  file,
  onRetry,
  onDiscard,
  onContinue,
}) => {
  const insets = useSafeAreaInsets();
  const [lines, setLines] = useState<string[]>(result.lines);

  const handleLineChange = useCallback((index: number, newValue: string) => {
    setLines(prev => {
      const updated = [...prev];
      updated[index] = newValue;
      return updated;
    });
  }, []);

  const handleCopy = useCallback(async () => {
    const text = lines.join('\n');
    try {
      await Share.share({ message: text, title: 'Extracted Text' });
    } catch {
      // User dismissed — no action needed
    }
  }, [lines]);

  const currentWordCount = lines
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  const currentCharCount = lines.join('\n').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}
          onPress={onDiscard}
          accessibilityLabel="Discard and go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={Colors.pureBlack} />
        </Pressable>
        <Text style={styles.headerTitle}>Extracted Text</Text>
        <Pressable
          style={({ pressed }) => [styles.copyButton, pressed && { opacity: 0.7 }]}
          onPress={handleCopy}
          accessibilityLabel="Copy all text"
          accessibilityRole="button"
        >
          <Ionicons name="copy-outline" size={20} color={Colors.primaryBlue} />
        </Pressable>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <ConfidenceBadge level={result.confidence.level} score={result.confidence.score} />
        <View style={styles.summaryDivider} />
        <Text style={styles.summaryMeta}>
          {currentWordCount} words · {currentCharCount} chars
        </Text>
        <View style={styles.summaryDivider} />
        <Text style={styles.summaryMeta}>
          {result.metadata.imageWidth}×{result.metadata.imageHeight}
        </Text>
      </View>

      {/* Confidence reason */}
      {result.confidence.reason && (
        <View style={styles.reasonRow}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.darkGray} />
          <Text style={styles.reasonText}>{result.confidence.reason}</Text>
        </View>
      )}

      {/* Edit hint */}
      <View style={styles.editHint}>
        <Ionicons name="create-outline" size={13} color={Colors.darkGray} />
        <Text style={styles.editHintText}>Tap any line to edit OCR mistakes</Text>
      </View>

      {/* Editable lines */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {lines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={40} color="#CCCCCC" />
            <Text style={styles.emptyText}>No text extracted</Text>
          </View>
        ) : (
          lines.map((line, i) => (
            <EditableLine
              key={i}
              index={i}
              value={line}
              onChange={handleLineChange}
            />
          ))
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.8 }]}
          onPress={onRetry}
          accessibilityLabel="Retry OCR"
          accessibilityRole="button"
        >
          <Ionicons name="refresh-outline" size={18} color={Colors.darkGray} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.continueButton, pressed && { opacity: 0.9 }]}
          onPress={() => onContinue(lines)}
          accessibilityLabel="Continue to document review"
          accessibilityRole="button"
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
  },
  copyButton: {
    padding: 4,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  summaryDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#D0D0D0',
  },
  summaryMeta: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: '#FAFAFA',
  },
  reasonText: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
  },
  editHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: '#F0F6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0ECFF',
  },
  editHintText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryBlue,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    paddingVertical: 2,
  },
  lineRowActive: {
    backgroundColor: '#F0F6FF',
  },
  lineNumber: {
    width: 36,
    paddingTop: 10,
    paddingLeft: 12,
    fontSize: 11,
    color: '#AAAAAA',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  lineInput: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.pureBlack,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: 'monospace',
    minHeight: 36,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    color: '#AAAAAA',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    gap: 12,
  },
  retryButton: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    height: 50,
    borderRadius: Radius.button,
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  retryButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.darkGray,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: Radius.button,
    backgroundColor: Colors.pureBlack,
  },
  continueButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
});
