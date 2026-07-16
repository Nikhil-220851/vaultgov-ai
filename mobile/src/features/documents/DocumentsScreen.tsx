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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Pull logged-in user details if available
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.phoneNumber || 'User';
  const avatarInitials = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : 'U';

  const uniqueCategories = Array.from(new Set(documents.map(d => d.category || 'Uncategorised')));

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
    setIsSheetOpen(false);
    setTimeout(async () => {
      const file = await pickPdfDocument();
      if (file) handleFileSelected(file);
    }, 300);
  }, [handleFileSelected]);

  const handleUploadImage = useCallback(async () => {
    setIsSheetOpen(false);
    setTimeout(() => {
      router.push('/scan' as any);
    }, 300);
  }, [router]);

  // ── Filtering ────────────────────────────────────────────────────────────

  const filteredDocuments = documents.filter((doc) => {
    const docCategory = doc.category || 'Uncategorised';
    const matchesCategory =
      selectedCategory === 'All' || docCategory === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      doc.title.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
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
      />
    </SafeAreaView>
  );
};

export default DocumentsScreen;

