"use no memo";
import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  onAttachPress?: () => void;
  onVoicePress?: () => void;
  isLoading?: boolean;
}

export function ChatInput({
  value,
  onChangeText,
  onSend,
  placeholder = 'Ask GovAssist AI...',
  onAttachPress,
  onVoicePress,
  isLoading = false,
}: ChatInputProps) {
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (value.trim()) {
      onSend();
      inputRef.current?.clear();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onAttachPress}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add-circle-outline" size={24} color={Colors.primaryBlue} />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.darkGray}
          multiline={true}
          // Usually in mobile chat apps, we don't submit on enter if multiline, but we can keep it as is or remove onSubmitEditing if it causes issues. The prompt asks to keep multiline behavior and send button.
          // We remove onSubmitEditing because with multiline=true it causes issues sometimes, but wait, the prompt says "Keep multiline TextInput behavior." 
          // So I will just set multiline={true}.
        />

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onVoicePress}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="mic-outline" size={20} color={Colors.darkGray} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.sendBtn,
          (!value.trim() || isLoading) ? styles.sendBtnDisabled : styles.sendBtnActive,
        ]}
        onPress={handleSend}
        disabled={!value.trim() || isLoading}
        activeOpacity={0.8}
      >
        <Ionicons name="send" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F7',
    borderRadius: Radius.button,
    paddingHorizontal: 8,
    minHeight: 48,
    maxHeight: 120,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 0 : 2, // Align to bottom
  },
  textInput: {
    flex: 1,
    minHeight: Platform.OS === 'ios' ? 32 : 40,
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 6 : 8,
    paddingBottom: Platform.OS === 'ios' ? 6 : 8,
    fontSize: Typography.sizes.sm,
    color: Colors.pureBlack,
    fontFamily: Typography.fontFamilies.sans,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1977F3',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  sendBtnActive: {
    backgroundColor: Colors.primaryBlue,
  },
  sendBtnDisabled: {
    backgroundColor: '#C8CDE8',
  },
});
