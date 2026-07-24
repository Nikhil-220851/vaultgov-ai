import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { auth } from '@/services/firebase';
import { Colors } from '@/theme';
import { CategoryFilter, CategoryType } from './components/CategoryFilter';
import { DocumentCard } from './components/DocumentCard';
import { DocumentSearchBar } from './components/DocumentSearchBar';
import { AddDocumentButton } from './components/AddDocumentButton';
import { UploadDocumentSheet } from './components/UploadDocumentSheet';
import { useDocumentStore } from './store/useDocumentStore';
import {
  pickPdfDocument,
  SelectedFile,
} from './upload.service';
import { styles } from './documents.styles';
import { AppHeader } from '@/components/AppHeader';

export const DocumentsScreen: React.FC = () => {
  const router = useRouter();
  const { documents, isHydrating, fetchDocuments } = useDocumentStore();

  useFocusEffect(
    useCallback(() => {
      fetchDocuments();
    }, [fetchDocuments])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [sortOption, setSortOption] = useState<'Recent' | 'Health' | 'Expiry'>('Recent');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // Prevents concurrent/duplicate document picker invocations
  const [isPickingPdf, setIsPickingPdf] = useState(false);

  // Pull logged-in user details if available
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.phoneNumber || 'User';
  const avatarInitials = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : 'U';

  const uniqueCategories = [
    ...Array.from(new Set(documents.map(d => d.category || 'Uncategorised'))),
    'Active',
    'Expiring Soon',
    'Expired',
    'No Expiry'
  ];

  const handleAvatarPress = () => {
    console.log('[DocumentsScreen] User profile avatar pressed');
  };

  const handleDocumentPress = (id: string, title: string) => {
    console.log(`[DocumentsScreen] Document pressed: ${title} (ID: ${id})`);
    router.push({
      pathname: '/document/[id]' as any,
      params: { id },
    });
  };

  // ── Upload sheet handlers ──────────────────────────────────────────────────

  const handleFileSelected = useCallback((file: SelectedFile) => {
    router.push({
      pathname: '/document-preview' as any,
      params: {
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType,
        source: file.source,
        size: file.size !== undefined ? String(file.size) : '',
      },
    });
  }, [router]);

  const handleTakePhoto = useCallback(async () => {
    setIsSheetOpen(false);
    setTimeout(() => {
      router.push('/scan/camera' as any);
    }, 300);
  }, [router]);

  const handleUploadPdf = useCallback(async () => {
    console.log('[PDF Upload] Upload button pressed');

    // Guard: if a picker is already open (double-tap / re-entrant call), do nothing.
    // The module-level flag in upload.service.ts is the final backstop, but this
    // state-level guard disables the button in the UI immediately.
    if (isPickingPdf) {
      console.warn('[PDF Upload] Pick already in progress, ignoring tap');
      return;
    }

    setIsSheetOpen(false);
    setIsPickingPdf(true);

    try {
      const file = await pickPdfDocument();
      console.log('[PDF Upload] Picker returned:', file ? file.name : 'canceled');
      if (file) {
        console.log('[PDF Upload] Upload started');
        handleFileSelected(file);
        console.log('[PDF Upload] Upload completed (navigated to preview)');
      }
    } finally {
      setIsPickingPdf(false);
    }
  }, [handleFileSelected, isPickingPdf]);

  const handleUploadImage = useCallback(async () => {
    setIsSheetOpen(false);
    setTimeout(() => {
      router.push('/scan' as any);
    }, 300);
  }, [router]);

  // ── Filtering ────────────────────────────────────────────────────────────

  const filteredDocuments = documents.filter((doc) => {
    const docCategory = doc.category || 'Uncategorised';
    
    // Support filtering by "Expired", "Expiring Soon", "Active", "No Expiry" in the category dropdown (Phase 5)
    // If the selected category is one of these status strings, we filter by status instead of category.
    let matchesCategory = false;
    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else if (['Expired', 'Expiring Soon', 'Active', 'No Expiry'].includes(selectedCategory as string)) {
      const statusMap: Record<string, string> = {
        'Expired': 'EXPIRED',
        'Expiring Soon': 'EXPIRING_SOON',
        'Active': 'ACTIVE',
        'No Expiry': 'NO_EXPIRY'
      };
      matchesCategory = (doc as any).status === statusMap[selectedCategory as string];
    } else {
      matchesCategory = docCategory === selectedCategory;
    }
    
    const query = searchQuery.trim().toLowerCase();
    const searchTarget = `${doc.title} ${doc.category || ''} ${(doc as any).extracted_text || ''}`.toLowerCase();
    const matchesSearch = query === '' || searchTarget.includes(query);
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    // Smart Sorting (Phase 5)
    if (sortOption === 'Recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortOption === 'Health') {
      return ((b as any).health_score || 0) - ((a as any).health_score || 0);
    } else if (sortOption === 'Expiry') {
      // Push EXPIRED and EXPIRING_SOON to top, ACTIVE to middle, NO_EXPIRY to bottom
      const priorityMap: Record<string, number> = {
        'EXPIRED': 4,
        'EXPIRING_SOON': 3,
        'ACTIVE': 2,
        'NO_EXPIRY': 1,
        'INVALID_DATE': 0
      };
      return (priorityMap[(b as any).status] || 0) - (priorityMap[(a as any).status] || 0);
    }
    return 0;
  });

  if (isHydrating) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8F5' }}>
          <ActivityIndicator size="large" color={Colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <AppHeader
        leftElement={<Text style={styles.headerTitle}>My vault</Text>}
        rightElement={
          <Pressable
            accessibilityLabel="User profile avatar"
            accessibilityRole="button"
            onPress={handleAvatarPress}
            style={styles.avatarPressable}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{avatarInitials}</Text>
            </View>
          </Pressable>
        }
        backgroundColor="#F7F8F5"
        borderBottomColor="transparent"
      />

      <View style={styles.container}>
        {/* Search Bar */}
        <DocumentSearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {/* Phase 5 Smart Sorting */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}>
          {(['Recent', 'Health', 'Expiry'] as const).map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setSortOption(opt)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 16,
                backgroundColor: sortOption === opt ? Colors.primaryBlue : '#F2F2F2',
              }}
            >
              <Text style={{
                color: sortOption === opt ? '#fff' : Colors.darkGray,
                fontSize: 12,
                fontWeight: '600'
              }}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Category Scrollable Chips */}
        <CategoryFilter
          categories={uniqueCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Document List */}
        <FlatList
          data={filteredDocuments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DocumentCard
              item={item}
              onPress={() => handleDocumentPress(item.id, item.title)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: '#666666', fontSize: 14 }}>
                No documents found
              </Text>
            </View>
          }
        />
      </View>

      {/* Floating Add Document Button — fixed above tab bar, outside the scroll */}
      <AddDocumentButton onPress={() => setIsSheetOpen(true)} />

      {/* Upload Document Bottom Sheet — Modal overlay, no background state change */}
      <UploadDocumentSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onFilePicked={handleFileSelected}
        onTakePhoto={handleTakePhoto}
        onUploadPdf={handleUploadPdf}
        onUploadImage={handleUploadImage}
        isPdfPickingActive={isPickingPdf}
      />
    </SafeAreaView>
  );
};

export default DocumentsScreen;

