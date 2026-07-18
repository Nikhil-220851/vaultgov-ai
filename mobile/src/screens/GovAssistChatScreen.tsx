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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { SuggestedQuestionCard } from '@/components/chat/SuggestedQuestionCard';
import { QuickChip } from '@/components/chat/QuickChip';
import { AIResponseCard, AICardData } from '@/components/chat/AIResponseCard';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Colors, Spacing, Typography } from '@/theme';
import { apiClient } from '@/services/api';

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

function getFormattedTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function GovAssistChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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

    try {
      const response = await apiClient.chatWithCopilot(text);
      let cardData: AICardData | undefined;

      // 1. Check for document status card
      if (response.intent === 'document_status' && response.metadata.documents && response.metadata.documents.has_documents) {
        const doc = response.metadata.documents.documents[0];
        if (doc) {
          const isSuccess = doc.visual_state === 'success';
          const isWarning = doc.visual_state === 'warning';
          const isDanger = doc.visual_state === 'danger';
          const badge = isSuccess ? 'Verified' : isWarning ? 'Needs Attention' : isDanger ? 'Action Required' : 'Uploaded';
          const badgeColor = isSuccess ? Colors.primaryGreen : isWarning ? Colors.primaryOrange : isDanger ? Colors.dangerRed : Colors.darkGray;
          
          cardData = {
            type: 'document',
            title: doc.title,
            subtitle: doc.category || 'Government Document',
            badge: badge,
            badgeColor: badgeColor,
            details: [
              { label: 'Category', value: doc.category || 'Uncategorised' },
              { label: 'Expiry Info', value: doc.expiry_text || 'Permanent' },
            ],
            primaryActionLabel: (isWarning || isDanger) ? 'Renew Now' : 'Locker Details',
            iconName: doc.icon_name || 'document-text-outline',
          };
        }
      } 
      // 2. Check for document reminder card
      else if (response.intent === 'document_reminder' && response.metadata.expiring_documents && response.metadata.expiring_documents.has_expiring) {
        const doc = response.metadata.expiring_documents.documents[0];
        if (doc) {
          cardData = {
            type: 'document',
            title: doc.title,
            subtitle: doc.category || 'Government Document',
            badge: 'Expiring Soon',
            badgeColor: Colors.primaryOrange,
            details: [
              { label: 'Expiry Info', value: doc.expiry_text || 'Expiring' },
              { label: 'Status', value: 'Needs renewal action' },
            ],
            primaryActionLabel: 'Renew Now',
            secondaryActionLabel: 'Locker Details',
            iconName: doc.icon_name || 'car-outline',
          };
        }
      } 
      // 3. Check for active schemes card
      else if ((response.intent === 'active_schemes' || response.intent === 'eligibility') && response.metadata.schemes && response.metadata.schemes.has_schemes) {
        const scheme = response.metadata.schemes.schemes[0];
        if (scheme) {
          cardData = {
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
      else if (response.intent === 'profile_summary' && response.metadata.profile) {
        const profile = response.metadata.profile;
        if (profile.profile_completed) {
          cardData = {
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
          cardData = {
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
      else if (response.intent === 'application_statistics' && response.metadata.statistics) {
        const stats = response.metadata.statistics;
        cardData = {
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

      const aiMsgId = `ai-${Date.now()}-${Math.random()}`;
      const aiMsg: Message = {
        id: aiMsgId,
        sender: 'ai',
        text: response.message,
        timestamp: getFormattedTime(),
        cardData,
      };
      console.log(`[GovAssistChatScreen] Created AI Message: ID=${aiMsgId}, text="${response.message}"`);

      console.log("===== COPILOT RESPONSE =====");
      console.log(JSON.stringify(response, null, 2));
      console.log("============================");
      console.log("Card Data:", cardData);

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#EBF2FF" />

      <ChatHeader onBackPress={() => router.back()} onClearPress={messages.length > 0 ? handleClear : undefined} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.chatArea}>
          {messages.length === 0 ? (
            renderWelcomeState()
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
              {QUICK_CHIPS.map((chip) => (
                <QuickChip key={`chip-${chip}`} label={chip} onPress={() => handleSend(chip)} />
              ))}
            </ScrollView>
          </View>

          {/* Chat Input */}
          <ChatInput value={inputText} onChangeText={setInputText} onSend={() => handleSend()} />
        </View>
      </KeyboardAvoidingView>
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
});
