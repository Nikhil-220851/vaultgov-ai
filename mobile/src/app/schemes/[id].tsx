import React, { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/context/UserContext';
import { useDocumentStore } from '@/features/documents/store/useDocumentStore';
import { SchemeDatabase } from '@/services/schemes/SchemeDatabase';
import { SchemeRepository } from '@/services/schemes/SchemeRepository';
import { SchemeDetailsScreen } from '@/screens/SchemeDetailsScreen';
import { Scheme } from '@/data/schemes';
import { colors } from '@/theme/colors';

export default function SchemeDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { documents } = useDocumentStore();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbEmpty, setDbEmpty] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadScheme() {
      if (!id) {
        console.error('[SchemeDetailRoute] No schemeId provided in route params.');
        if (isMounted) setLoading(false);
        return;
      }

      try {
        await SchemeDatabase.initDatabase();
        const all = await SchemeDatabase.getAllSchemes();

        if (!isMounted) return;

        if (all.length === 0) {
          // The local database has not been populated yet — sync hasn't run.
          console.warn('[SchemeDetailRoute] Local scheme database is empty. Sync may not have run yet.');
          setDbEmpty(true);
          return;
        }

        const record = all.find((s) => s.schemeId === id);
        if (record) {
          const evaluated = SchemeRepository.evaluateScheme(record, user, documents);
          setScheme(evaluated);
          console.log(`[SchemeDetailRoute] Loaded scheme: ${record.title} (${id})`);
        } else {
          console.warn(`[SchemeDetailRoute] Scheme '${id}' not found in local database (${all.length} schemes stored).`);
        }
      } catch (err) {
        console.error('[SchemeDetailRoute] Failed to load/evaluate scheme:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadScheme();
    return () => {
      isMounted = false;
    };
  }, [id, user, documents]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (dbEmpty) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Schemes Not Synced Yet</Text>
        <Text style={styles.errorText}>
          Pull down to refresh the Scheme Centre to sync schemes from the server first.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!scheme) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Scheme Not Found</Text>
        <Text style={styles.errorText}>
          This scheme (ID: {id}) could not be found in your local database.{'\n'}
          Try pulling down to refresh from the Scheme Centre.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <SchemeDetailsScreen scheme={scheme} />;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#707070',
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

