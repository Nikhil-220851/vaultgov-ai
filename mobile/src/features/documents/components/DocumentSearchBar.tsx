import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import { styles } from '../documents.styles';

interface DocumentSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const DocumentSearchBar: React.FC<DocumentSearchBarProps> = ({ value, onChangeText }) => {
  return (
    <View style={styles.searchContainer}>
      <Ionicons
        name="search-outline"
        size={20}
        color={Colors.darkGray}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Search documents..."
        placeholderTextColor={Colors.darkGray}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
};

export default DocumentSearchBar;
