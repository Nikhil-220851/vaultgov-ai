"use no memo";
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '@/theme';

interface MessageBubbleProps {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export function MessageBubble({ sender, text, timestamp }: MessageBubbleProps) {
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const isUser = sender === 'user';

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.containerUser : styles.containerAi,
        { opacity: fadeAnim },
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAi,
        ]}
      >
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAi]}>
          {text}
        </Text>
        <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAi]}>
          {timestamp}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  containerUser: {
    justifyContent: 'flex-end',
  },
  containerAi: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: '#EBF2FF',
    borderColor: '#D4E2FD',
    borderBottomRightRadius: Radius.xs,
  },
  bubbleAi: {
    backgroundColor: Colors.white,
    borderColor: '#EBEBEB',
    borderBottomLeftRadius: Radius.xs,
  },
  text: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    fontFamily: Typography.fontFamilies.sans,
  },
  textUser: {
    color: Colors.pureBlack,
  },
  textAi: {
    color: Colors.pureBlack,
  },
  timestamp: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontFamily: Typography.fontFamilies.sans,
  },
  timestampUser: {
    color: Colors.primaryBlue,
  },
  timestampAi: {
    color: Colors.darkGray,
  },
});
