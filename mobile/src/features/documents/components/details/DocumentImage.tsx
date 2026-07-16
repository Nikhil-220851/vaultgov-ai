import React, { memo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/theme';

interface DocumentImageProps {
  /** Cloudinary HTTPS URL or null when no image is available. */
  imageUri: string | null;
}

/** Large image card with loading placeholder and error fallback. */
export const DocumentImage = memo<DocumentImageProps>(({ imageUri }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!imageUri) {
    return <NoImagePlaceholder reason="No image available" />;
  }

  return (
    <View style={styles.container}>
      {/* Show placeholder behind until image loads */}
      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.primaryBlue} />
        </View>
      )}

      {error ? (
        <NoImagePlaceholder reason="Image could not be loaded" />
      ) : (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
          onLoadStart={() => {
            setLoading(true);
            setError(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          accessibilityLabel="Document image"
        />
      )}
    </View>
  );
});

DocumentImage.displayName = 'DocumentImage';

// ── Private helper ─────────────────────────────────────────────────────────────

const NoImagePlaceholder = memo<{ reason: string }>(({ reason }) => (
  <View style={[styles.container, styles.placeholder]}>
    <Ionicons name="document-text-outline" size={44} color={Colors.darkGray} />
    <Text style={styles.placeholderText}>{reason}</Text>
  </View>
));

NoImagePlaceholder.displayName = 'NoImagePlaceholder';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 240,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    overflow: 'hidden',
    backgroundColor: '#F5F5F3',
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...(StyleSheet.absoluteFill as any),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F3',
    zIndex: 1,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  placeholderText: {
    fontSize: 13,
    color: Colors.darkGray,
    marginTop: Spacing.xs,
  },
});
