import React, { memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/theme';

interface OCRTextSectionProps {
  /** The extracted OCR text, or null/empty if unavailable. */
  text: string | null;
}

/** Scrollable, selectable OCR text container with monospace styling. */
export const OCRTextSection = memo<OCRTextSectionProps>(({ text }) => {
  const hasText = typeof text === 'string' && text.trim().length > 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>EXTRACTED TEXT</Text>
        {hasText && (
          <Text style={styles.charCount}>
            {text!.length} chars
          </Text>
        )}
      </View>

      <View style={styles.card}>
        {hasText ? (
          <ScrollView
            style={styles.scroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={styles.text}
              selectable
              accessibilityLabel="Extracted OCR text"
            >
              {text}
            </Text>
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>No text extracted</Text>
        )}
      </View>
    </View>
  );
});

OCRTextSection.displayName = 'OCRTextSection';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#888888',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  charCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
  },
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    maxHeight: 240,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  scroll: {
    padding: 12,
  },
  text: {
    fontSize: Typography.sizes.xs,
    color: '#333333',
    lineHeight: 20,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  emptyText: {
    padding: 12,
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    fontStyle: 'italic',
  },
});
