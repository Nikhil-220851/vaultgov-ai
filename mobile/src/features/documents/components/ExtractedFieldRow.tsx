/**
 * ExtractedFieldRow.tsx
 *
 * Renders a label and value pair in the Document Preview screen.
 * Supports:
 *  - Inline editing: Tapping the edit icon toggles a text input.
 *  - Missing state: If the value is null or empty, displays "Not found" in a warning/error style.
 *  - Validation: Highlights required fields if missing.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/theme';
import { ExtractedField } from '../services/ocr.service';

interface ExtractedFieldRowProps {
  field: ExtractedField;
  onSaveValue: (value: string) => void;
}

export const ExtractedFieldRow: React.FC<ExtractedFieldRowProps> = ({
  field,
  onSaveValue,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(field.value ?? '');

  const handleEditPress = () => {
    setTempValue(field.value ?? '');
    setIsEditing(true);
  };

  const handleSave = () => {
    onSaveValue(tempValue.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const isMissing = !field.value || field.value.trim() === '';

  return (
    <View style={styles.row}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {field.label}
          {field.required && <Text style={styles.requiredAsterisk}> *</Text>}
        </Text>
      </View>

      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.input}
            value={tempValue}
            onChangeText={setTempValue}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            placeholderTextColor={Colors.darkGray}
            autoFocus
          />
          <Pressable onPress={handleSave} style={styles.actionButton} accessibilityLabel="Save edit">
            <Ionicons name="checkmark-circle" size={22} color={Colors.primaryGreen} />
          </Pressable>
          <Pressable onPress={handleCancel} style={styles.actionButton} accessibilityLabel="Cancel edit">
            <Ionicons name="close-circle" size={22} color={Colors.dangerRed} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.valueContainer}>
          <Text
            style={[
              styles.value,
              isMissing && styles.missingValue,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {isMissing ? 'Not found' : field.value}
          </Text>
          <Pressable
            onPress={handleEditPress}
            style={styles.editIconPressable}
            accessibilityLabel={`Edit ${field.label}`}
            accessibilityRole="button"
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={isMissing ? Colors.dangerRed : Colors.darkGray}
            />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
    minHeight: 56,
  },
  labelContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamilies.sans,
    color: '#666666',
  },
  requiredAsterisk: {
    color: Colors.dangerRed,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '65%',
  },
  value: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    fontFamily: Typography.fontFamilies.sans,
    color: Colors.pureBlack,
    textAlign: 'right',
    marginRight: Spacing.xs,
  },
  missingValue: {
    color: Colors.dangerRed,
    fontWeight: Typography.weights.bold,
  },
  editIconPressable: {
    padding: Spacing.xs,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '65%',
    justifyContent: 'flex-end',
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamilies.sans,
    color: Colors.pureBlack,
    borderColor: '#D0D0D0',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: '#FAF9F6',
    textAlign: 'right',
  },
  actionButton: {
    marginLeft: Spacing.xs,
    padding: 2,
  },
});

export default ExtractedFieldRow;
