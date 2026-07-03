import React from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';
import { CATEGORIES, CategoryType } from '../documents.constants';
import { styles } from '../documents.styles';

interface CategoryFilterProps {
  selectedCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.categoriesContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScrollContent}
      >
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <Pressable
              key={category}
              onPress={() => onSelectCategory(category)}
              accessibilityRole="button"
              accessibilityLabel={`Filter: ${category}`}
              accessibilityState={{ selected: isActive }}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CategoryFilter;
