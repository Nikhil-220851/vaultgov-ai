import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator, 
  Alert, 
  TextInput,
  StyleSheet,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient, Conversation } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '@/theme';
import { Swipeable } from 'react-native-gesture-handler';

function formatRelativeTime(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 3600 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'Last Week';
  return d.toLocaleDateString();
}

export default function ConversationListScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();

  const loadConversations = async () => {
    try {
      const data = await apiClient.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations', error);
      Alert.alert('Error', 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);

  const handleNewChat = () => {
    router.push({ pathname: '/gov-assist-chat', params: { conversation_id: 'null' } } as any);
  };

  const handleResumeChat = (id: string) => {
    router.push({ pathname: '/gov-assist-chat', params: { conversation_id: id } } as any);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteConversation(id);
      setConversations(conversations.filter(c => c.id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete conversation.');
    }
  };

  const renderRightActions = (progress: any, dragX: any, id: string) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity onPress={() => handleDelete(id)} style={styles.deleteAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash" size={24} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emoji}>🤖</Text>
      <Text style={styles.emptyTitle}>Welcome to VaultGov AI</Text>
      <Text style={styles.emptySubtitle}>
        Ask about government schemes,{"\n"}documents and eligibility.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleNewChat}>
        <Text style={styles.emptyButtonText}>Start New Chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GovAssist AI</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.iconButton}>
            <Ionicons name="search" size={22} color={Colors.primaryBlue} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNewChat} style={styles.iconButton}>
            <Ionicons name="add-circle-outline" size={24} color={Colors.primaryBlue} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search chats..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primaryBlue} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primaryBlue]} />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={conversations.length === 0 ? styles.emptyListContent : styles.listContent}
          renderItem={({ item }) => (
            <Swipeable renderRightActions={(p, d) => renderRightActions(p, d, item.id)}>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => handleResumeChat(item.id)}
                style={styles.chatCard}
              >
                <View style={styles.chatAvatar}>
                  <Ionicons name="chatbubble-ellipses" size={20} color={Colors.primaryBlue} />
                </View>
                <View style={styles.chatInfo}>
                  <Text style={styles.chatTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.chatPreview} numberOfLines={1}>
                    Tap to view conversation...
                  </Text>
                </View>
                <View style={styles.chatMeta}>
                  <Text style={styles.chatTime}>
                    {formatRelativeTime(item.updated_at)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" style={{ marginTop: 4 }} />
                </View>
              </TouchableOpacity>
            </Swipeable>
          )}
        />
      )}

      {/* Floating Action Button */}
      {conversations.length > 0 && !loading && (
        <TouchableOpacity style={styles.fab} onPress={handleNewChat}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.pureBlack,
    paddingVertical: 0, // Android fix
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 80, // for FAB
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.pureBlack,
    marginBottom: 4,
  },
  chatPreview: {
    fontSize: 14,
    color: Colors.darkGray,
  },
  chatMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  chatTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  deleteAction: {
    backgroundColor: Colors.dangerRed,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: -50,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  }
});
