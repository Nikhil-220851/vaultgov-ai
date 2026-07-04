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
  const [messageCounter, setMessageCounter] = useState(0);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsgId = `msg-${messageCounter + 1}`;

    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: getFormattedTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response after 1.5s
    setTimeout(() => {
      let aiText = '';
      let cardData: AICardData | undefined;

      const lowerText = text.toLowerCase();

      if (lowerText.includes('schemes') || lowerText.includes('eligible')) {
        aiText = 'Based on your profile, I found multiple government benefits you are eligible to receive. Here is the top matching program:';
        cardData = {
          type: 'scheme',
          title: 'PM Awas Yojana (PMAY)',
          subtitle: 'Ministry of Housing and Urban Affairs',
          badge: 'Eligible',
          badgeColor: Colors.primaryGreen,
          details: [
            { label: 'Financial Assistance', value: 'Subsidy up to ₹2.67 Lakh' },
            { label: 'Application Deadline', value: '31 Dec 2026' },
            { label: 'Expected Process Time', value: '30–45 Days' },
          ],
          primaryActionLabel: 'Apply Now',
          secondaryActionLabel: 'View Details',
          iconName: 'home-outline',
        };
      } else if (lowerText.includes('expiry') || lowerText.includes('expire') || lowerText.includes('document')) {
        aiText = 'I scanned your VaultGov locker. Most of your credentials are valid, but we identified one document requiring immediate renewal:';
        cardData = {
          type: 'document',
          title: 'Driving Licence (DL)',
          subtitle: 'Ministry of Road Transport & Highways',
          badge: 'Expiring Soon',
          badgeColor: Colors.primaryOrange,
          details: [
            { label: 'Expiry Date', value: '24 July 2026' },
            { label: 'Validity Remaining', value: '20 days' },
            { label: 'Status', value: 'Needs renewal action' },
          ],
          primaryActionLabel: 'Renew Now',
          secondaryActionLabel: 'Locker Details',
          iconName: 'car-outline',
        };
      } else if (lowerText.includes('health') || lowerText.includes('score')) {
        aiText = 'Your Document Health Score is currently at 78/100. Let\'s get it to 100/100 by completing these recommended items:';
        cardData = {
          type: 'health',
          title: 'Document Health Score',
          subtitle: 'Locker Health Audit',
          badge: '78 / 100',
          badgeColor: Colors.primaryGreen,
          details: [
            { label: 'Verified Records', value: '9 Documents Linked' },
            { label: 'Action Required', value: 'Renew Driving Licence' },
            { label: 'Missing Documents', value: 'Ration Card (EWS Verification)' },
          ],
          primaryActionLabel: 'Fix Issues Now',
          iconName: 'shield-checkmark-outline',
        };
      } else {
        aiText = `Thank you for your query about "${text}". I am here to help you navigate government schemes, verify document renewals, or check application statuses. What would you like to explore next?`;
      }

      const aiMsgId = `msg-${messageCounter + 2}`;

      const aiMsg: Message = {
        id: aiMsgId,
        sender: 'ai',
        text: aiText,
        timestamp: getFormattedTime(),
        cardData,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setMessageCounter((prevVal) => prevVal + 2);
      setIsTyping(false);
    }, 1500);
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
              {QUICK_CHIPS.map((chip, index) => (
                <QuickChip key={index} label={chip} onPress={() => handleSend(chip)} />
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
