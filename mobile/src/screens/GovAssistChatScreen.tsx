"use no memo";
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { SuggestedQuestionCard } from '@/components/chat/SuggestedQuestionCard';
import { QuickChip } from '@/components/chat/QuickChip';
import { AIResponseCard, AICardData } from '@/components/chat/AIResponseCard';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Colors, Spacing, Typography, Radius } from '@/theme';
import { apiClient, Conversation } from '@/services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  cardData?: AICardData;
}

const SUGGESTED_QUESTIONS = [
  { id: '1', question: 'What schemes am I eligible for?', icon: 'ribbon-outline' as const },
  { id: '2', question: 'Check my document expiry', icon: 'time-outline' as const },
  { id: '3', question: 'Improve my health score', icon: 'shield-checkmark-outline' as const },
  { id: '4', question: 'Apply for Ration Card', icon: 'document-text-outline' as const },
];

const QUICK_CHIPS = [
  'My Documents',
  'Active Schemes',
  'Eligibility',
  'Applications',
  'Deadlines',
  'Help',
];

function getFormattedTime(dateObj?: Date) {
  const d = dateObj || new Date();
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function extractCardDataFromMetadata(intent: string, metadata: any): AICardData | undefined {
  if (!metadata) return undefined;
  
  // 1. Check for document status card
  if (intent === 'document_status' && metadata.documents && metadata.documents.has_documents) {
    const doc = metadata.documents.documents[0];
    if (doc) {
      const isSuccess = doc.visual_state === 'success';
      const isWarning = doc.visual_state === 'warning';
      const isDanger = doc.visual_state === 'danger';
      
      let badge = isSuccess ? 'Verified' : isWarning ? 'Needs Attention' : isDanger ? 'Action Required' : 'Uploaded';
      let badgeColor: string = isSuccess ? Colors.primaryGreen : isWarning ? Colors.primaryOrange : isDanger ? Colors.dangerRed : Colors.darkGray;
      let primaryActionLabel = (isWarning || isDanger) ? 'Renew Now' : 'Locker Details';
      let expiryInfo = 'Permanent';

      let formattedDate = doc.expiry_date;
      if (doc.expiry_date) {
        const d = new Date(doc.expiry_date);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
      }

      const docStatus = doc.status ? String(doc.status).toUpperCase() : '';

      if (docStatus === 'EXPIRED') {
        badge = 'Expired';
        badgeColor = Colors.dangerRed;
        expiryInfo = `Expired on ${formattedDate || 'Unknown Date'}`;
        primaryActionLabel = 'Renew Now';
      } else if (docStatus === 'EXPIRING_SOON') {
        badge = 'Expiring Soon';
        badgeColor = Colors.primaryOrange;
        expiryInfo = `Expires on ${formattedDate || 'Unknown Date'}`;
        primaryActionLabel = 'Renew Now';
      } else if (doc.expiry_date) {
        expiryInfo = `Expires on ${formattedDate}`;
      } else if (!doc.expiry_date && (!docStatus || docStatus === 'NO_EXPIRY' || docStatus === 'VALID' || docStatus === 'PENDING' || docStatus === 'VERIFIED')) {
        expiryInfo = 'Permanent';
      }

      return {
        type: 'document',
        title: doc.title,
        subtitle: doc.category || 'Government Document',
        badge: badge,
        badgeColor: badgeColor,
        details: [
          { label: 'Category', value: doc.category || 'Uncategorised' },
          { label: 'Expiry Info', value: expiryInfo },
        ],
        primaryActionLabel: primaryActionLabel,
        iconName: doc.icon_name || 'document-text-outline',
      };
    }
  } 
  // 2. Check for document reminder card
  else if (intent === 'document_reminder' && metadata.expiring_documents && metadata.expiring_documents.has_expiring) {
    const doc = metadata.expiring_documents.documents[0];
    if (doc) {
      let expiryInfo = 'Expiring';
      let formattedDate = doc.expiry_date;
      if (doc.expiry_date) {
        const d = new Date(doc.expiry_date);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
      }
      
      const docStatus = doc.status ? String(doc.status).toUpperCase() : '';
      let badge = 'Expiring Soon';
      let badgeColor: string = Colors.primaryOrange;
      
      if (docStatus === 'EXPIRED') {
        badge = 'Expired';
        badgeColor = Colors.dangerRed;
        expiryInfo = `Expired on ${formattedDate || 'Unknown Date'}`;
      } else if (docStatus === 'EXPIRING_SOON') {
        badge = 'Expiring Soon';
        badgeColor = Colors.primaryOrange;
        expiryInfo = `Expires on ${formattedDate || 'Unknown Date'}`;
      } else if (doc.expiry_date) {
        expiryInfo = `Expires on ${formattedDate}`;
      }

      return {
        type: 'document',
        title: doc.title,
        subtitle: doc.category || 'Government Document',
        badge: badge,
        badgeColor: badgeColor,
        details: [
          { label: 'Expiry Info', value: expiryInfo },
          { label: 'Status', value: docStatus === 'EXPIRED' ? 'Requires immediate action' : 'Needs renewal action' },
        ],
        primaryActionLabel: 'Renew Now',
        secondaryActionLabel: 'Locker Details',
        iconName: doc.icon_name || 'car-outline',
      };
    }
  } 
  // 3. Check for active schemes card
  else if ((intent === 'active_schemes' || intent === 'eligibility') && metadata.schemes && metadata.schemes.has_schemes) {
    const scheme = metadata.schemes.schemes[0];
    if (scheme) {
      return {
        type: 'scheme',
        title: scheme.title,
        subtitle: scheme.ministry || 'Ministry',
        badge: scheme.status || 'Active',
        badgeColor: Colors.primaryGreen,
        details: [
          { label: 'Category', value: scheme.category || 'General' },
          { label: 'Application Deadline', value: scheme.applicationEnd || 'Permanent' },
        ],
        primaryActionLabel: 'Apply Now',
        secondaryActionLabel: 'View Details',
        iconName: 'home-outline',
      };
    }
  } 
  // 4. Check for profile summary card
  else if (intent === 'profile_summary' && metadata.profile) {
    const profile = metadata.profile;
    if (profile.profile_completed) {
      return {
        type: 'health',
        title: 'Profile Status',
        subtitle: 'Profile Audit',
        badge: 'Complete',
        badgeColor: Colors.primaryGreen,
        details: [
          { label: 'Status', value: '100% Completed' },
        ],
        primaryActionLabel: 'Explore Schemes',
        iconName: 'shield-checkmark-outline',
      };
    } else if (profile.missing_fields && profile.missing_fields.length > 0) {
      return {
        type: 'health',
        title: 'Profile Incomplete',
        subtitle: 'Profile Audit',
        badge: 'Action Required',
        badgeColor: Colors.primaryOrange,
        details: [
          { label: 'Missing Fields', value: profile.missing_fields.join(', ') },
        ],
        primaryActionLabel: 'Complete Profile',
        iconName: 'shield-checkmark-outline',
      };
    }
  } 
  // 5. Check for application statistics card
  else if (intent === 'application_statistics' && metadata.statistics) {
    const stats = metadata.statistics;
    return {
      type: 'health',
      title: 'Document Upload Stats',
      subtitle: 'Locker Audit',
      badge: `${stats.total_documents} Docs`,
      badgeColor: Colors.primaryGreen,
      details: [
        { label: 'Total Categories', value: `${stats.total_categories}` },
        { label: 'Storage Used', value: `${(stats.storage_used_bytes / (1024 * 1024)).toFixed(1)} MB` },
      ],
      primaryActionLabel: 'Manage Documents',
      iconName: 'shield-checkmark-outline',
    };
  }
  return undefined;
}

export function GovAssistChatScreen() {
  const router = useRouter();
  const { conversation_id } = useLocalSearchParams();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    (conversation_id as string) || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const [historyList, setHistoryList] = useState<Conversation[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const openDrawer = () => {
    setIsDrawerOpen(true);
    loadHistoryList();
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsDrawerOpen(false);
    });
  };

  const loadHistoryList = async () => {
    setIsLoadingList(true);
    try {
      const data = await apiClient.getConversations();
      setHistoryList(data);
    } catch (e) {
      console.error('Failed to load history list', e);
    } finally {
      setIsLoadingList(false);
    }
  };

  const startNewChat = () => {
    closeDrawer();
    if (currentConversationId !== null || messages.length > 0) {
      setCurrentConversationId(null);
      setMessages([]);
      router.setParams({ conversation_id: 'null' });
    }
  };

  const selectConversation = (id: string) => {
    closeDrawer();
    if (id !== currentConversationId) {
      setCurrentConversationId(id);
      setMessages([]);
      router.setParams({ conversation_id: id });
    }
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (conversation_id && conversation_id !== 'null') {
      loadHistory(conversation_id as string);
    }
  }, [conversation_id]);

  const loadHistory = async (id: string) => {
    setIsLoadingHistory(true);
    try {
      const data = await apiClient.getConversationHistory(id);
      const historyMsgs: Message[] = data.messages.map((m: any) => {
        let cardData = undefined;
        if (m.assistant_data) {
          cardData = extractCardDataFromMetadata(m.assistant_data.intent, m.assistant_data.metadata);
        }
        return {
          id: m.id,
          sender: m.role as 'user' | 'ai',
          text: m.content,
          timestamp: getFormattedTime(new Date(m.created_at)),
          cardData,
        };
      });
      setMessages(historyMsgs);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    if (isTyping) return; // Prevent concurrent requests
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsgId = `user-${Date.now()}-${Math.random()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: getFormattedTime(),
    };
    console.log(`[GovAssistChatScreen] Created USER Message: ID=${userMsgId}, text="${text}"`);

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await apiClient.chatWithCopilot(text, currentConversationId || undefined, abortControllerRef.current.signal);
      
      if (response.metadata && response.metadata.conversation_id) {
        setCurrentConversationId(response.metadata.conversation_id);
      }
      
      let cardData = extractCardDataFromMetadata(response.intent, response.metadata);

      // The card parsing logic is now in extractCardDataFromMetadata

      const aiMsgId = `ai-${Date.now()}-${Math.random()}`;
      const aiMsg: Message = {
        id: aiMsgId,
        sender: 'ai',
        text: response.message,
        timestamp: getFormattedTime(),
        cardData,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      if (err.name === 'AbortError' || (err.message && err.message.includes('abort'))) {
        console.log('[GovAssistChatScreen] Request was aborted');
        return;
      }
      console.error('[GovAssistChatScreen] Failed to get response from copilot:', err);
      const errorMsgId = `error-${Date.now()}-${Math.random()}`;
      const errorMsg: Message = {
        id: errorMsgId,
        sender: 'ai',
        text: 'Sorry, I am unable to connect to the assistant right now. Please check your network connection and try again.',
        timestamp: getFormattedTime(),
      };
      console.log(`[GovAssistChatScreen] Created ERROR Message: ID=${errorMsgId}`);
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  const handleCardPrimaryAction = (cardType: string) => {
    if (cardType === 'scheme') {
      router.push('/(tabs)/schemes' as any);
    } else if (cardType === 'document') {
      router.push('/(tabs)/docs' as any);
    } else if (cardType === 'health') {
      router.push('/(tabs)/profile' as any);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const renderWelcomeState = () => {
    return (
      <ScrollView
        style={styles.welcomeScroll}
        contentContainerStyle={styles.welcomeContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.illustrationWrap}>
          <View style={styles.aiLogo}>
            <Ionicons name="sparkles" size={32} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.welcomeTitle}>Ask GovAssist AI</Text>
        <Text style={styles.welcomeSubtitle}>
          Your government services assistant. Securely access eligibility checks, check document expiries, track submitted applications, and find active central/state schemes.
        </Text>

        <View style={styles.welcomeSection}>
          <Text style={styles.sectionHeader}>SUGGESTED QUESTIONS</Text>
          {SUGGESTED_QUESTIONS.map((item) => (
            <SuggestedQuestionCard
              key={item.id}
              question={item.question}
              icon={item.icon}
              onPress={() => handleSend(item.question)}
            />
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderDrawer = () => {
    if (!isDrawerOpen) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: { title: string; data: Conversation[] }[] = [
      { title: 'Today', data: [] },
      { title: 'Yesterday', data: [] },
      { title: 'Last 7 Days', data: [] },
      { title: 'Older', data: [] },
    ];

    historyList.forEach(c => {
      const d = new Date(c.updated_at);
      if (d >= today) groups[0].data.push(c);
      else if (d >= yesterday) groups[1].data.push(c);
      else if (d >= lastWeek) groups[2].data.push(c);
      else groups[3].data.push(c);
    });

    const activeGroups = groups.filter(g => g.data.length > 0);

    return (
      <View style={styles.drawerOverlay} pointerEvents="box-none">
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[
            styles.drawerBackdrop,
            {
              opacity: drawerAnim.interpolate({
                inputRange: [-SCREEN_WIDTH, 0],
                outputRange: [0, 0.5],
              })
            }
          ]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[
          styles.drawerContainer,
          { transform: [{ translateX: drawerAnim }] }
        ]}>
          <SafeAreaView style={styles.drawerSafeArea} edges={['top', 'bottom']}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Chats</Text>
              <TouchableOpacity onPress={startNewChat} style={styles.newChatBtn}>
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.newChatText}>New Chat</Text>
              </TouchableOpacity>
            </View>

            {isLoadingList ? (
              <ActivityIndicator size="small" color={Colors.primaryBlue} style={{ marginTop: 20 }} />
            ) : (
              <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
                {activeGroups.map((group) => (
                  <View key={group.title} style={styles.drawerGroup}>
                    <Text style={styles.drawerGroupTitle}>{group.title}</Text>
                    {group.data.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.drawerItem,
                          c.id === currentConversationId && styles.drawerItemActive
                        ]}
                        onPress={() => selectConversation(c.id)}
                      >
                        <Ionicons 
                          name="chatbubble-outline" 
                          size={16} 
                          color={c.id === currentConversationId ? Colors.primaryBlue : Colors.darkGray} 
                        />
                        <Text 
                          style={[
                            styles.drawerItemText,
                            c.id === currentConversationId && styles.drawerItemTextActive
                          ]}
                          numberOfLines={1}
                        >
                          {c.title || 'New Chat'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    );
  };

  const activeConversation = historyList.find(c => c.id === currentConversationId);
  const headerTitle = activeConversation ? activeConversation.title : 'GovAssist AI';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#EBF2FF" />

      <ChatHeader 
        onMenuPress={openDrawer}
        onBackPress={() => router.back()} 
        onClearPress={messages.length > 0 ? handleClear : undefined} 
        title={headerTitle}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.chatArea}>
          {isLoadingHistory ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primaryBlue} />
              <Text style={{ marginTop: 10, color: Colors.darkGray }}>Loading conversation...</Text>
            </View>
          ) : messages.length === 0 ? (
            renderWelcomeState()
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => (
                <View>
                  <MessageBubble sender={item.sender} text={item.text} timestamp={item.timestamp} />
                  {item.cardData && (
                    <View style={styles.cardPadding}>
                      <AIResponseCard
                        data={item.cardData}
                        onPrimaryAction={() => handleCardPrimaryAction(item.cardData!.type)}
                        onSecondaryAction={() => handleCardPrimaryAction(item.cardData!.type)}
                      />
                    </View>
                  )}
                </View>
              )}
              ListFooterComponent={() => (isTyping ? <TypingIndicator /> : null)}
            />
          )}

          {/* Quick chips bar */}
          <View style={styles.chipsBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll} keyboardShouldPersistTaps="handled">
              {QUICK_CHIPS.map((chip) => (
                <QuickChip key={`chip-${chip}`} label={chip} onPress={() => handleSend(chip)} />
              ))}
            </ScrollView>
          </View>

          {/* Chat Input */}
          <ChatInput 
            value={inputText} 
            onChangeText={setInputText} 
            onSend={() => handleSend()} 
            isLoading={isTyping} 
          />
        </View>
      </KeyboardAvoidingView>
      {renderDrawer()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EBF2FF',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatArea: {
    flex: 1,
  },
  welcomeScroll: {
    flex: 1,
  },
  welcomeContent: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  illustrationWrap: {
    marginTop: 20,
    marginBottom: 16,
  },
  aiLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: Spacing.xl,
  },
  welcomeSection: {
    width: '100%',
  },
  sectionHeader: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryBlue,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  messageList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 20,
  },
  cardPadding: {
    paddingLeft: 4,
    paddingRight: 4,
  },
  chipsBar: {
    height: 48,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  chipsScroll: {
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#F9FAFB',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  drawerSafeArea: {
    flex: 1,
  },
  drawerHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  drawerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.pureBlack,
    marginBottom: Spacing.sm,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBlue,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    justifyContent: 'center',
  },
  newChatText: {
    color: '#FFF',
    fontWeight: Typography.weights.semibold,
    marginLeft: 6,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerGroup: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  drawerGroupTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.darkGray,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    marginBottom: 4,
  },
  drawerItemActive: {
    backgroundColor: '#EBF2FF',
  },
  drawerItemText: {
    fontSize: Typography.sizes.sm,
    color: Colors.pureBlack,
    marginLeft: 8,
    flex: 1,
  },
  drawerItemTextActive: {
    color: Colors.primaryBlue,
    fontWeight: Typography.weights.semibold,
  },
});
