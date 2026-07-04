import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth } from '@/services/firebase';
import { Colors } from '@/theme';
import { MOCK_USER } from '@/features/home/constants';
import { CategoryType } from './documents.constants';
import { DocumentCard } from './components/DocumentCard';
import { DocumentSearchBar } from './components/DocumentSearchBar';
import { CategoryFilter } from './components/CategoryFilter';
import { AddDocumentButton } from './components/AddDocumentButton';
import { UploadDocumentSheet } from './components/UploadDocumentSheet';
import { useDocumentStore } from './store/useDocumentStore';
import {
  captureWithCamera,
  pickFromGallery,
  pickPdfDocument,
  SelectedFile,
} from './upload.service';
import { styles } from './documents.styles';

export const DocumentsScreen: React.FC = () => {
  const router = useRouter();
  const { documents, isHydrating } = useDocumentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Pull logged-in user details if available, fallback to mock user
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.phoneNumber || MOCK_USER.name;
  const avatarInitials = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : MOCK_USER.avatarInitials;

  const handleAvatarPress = () => {
    console.log('[DocumentsScreen] User profile avatar pressed');
  };

  const handleDocumentPress = (id: string, title: string) => {
    console.log(`[DocumentsScreen] Document pressed: ${title} (ID: ${id})`);
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
    // Small delay so sheet closes before camera UI opens
    setTimeout(async () => {
      const file = await captureWithCamera();
      if (file) handleFileSelected(file);
    }, 300);
  }, [handleFileSelected]);

  const handleUploadPdf = useCallback(async () => {
    setIsSheetOpen(false);
    setTimeout(async () => {
      const file = await pickPdfDocument();
      if (file) handleFileSelected(file);
    }, 300);
  }, [handleFileSelected]);

  const handleUploadImage = useCallback(async () => {
    setIsSheetOpen(false);
    setTimeout(async () => {
      const file = await pickFromGallery();
      if (file) handleFileSelected(file);
    }, 300);
  }, [handleFileSelected]);

  // ── Filtering ────────────────────────────────────────────────────────────

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory =
      selectedCategory === 'All' || doc.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      doc.title.toLowerCase().includes(query) ||
      doc.subtitle.toLowerCase().includes(query);
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>My vault</Text>
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
        </View>

        {/* Search Bar */}
        <DocumentSearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {/* Category Scrollable Chips */}
        <CategoryFilter
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

