import React from 'react';
import { View } from 'react-native';
import { CATEGORIES, CategoryType } from '../documents.constants';
import { styles } from '../documents.styles';
import { SegmentedTabs } from '@/components/SegmentedTabs';

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
      <SegmentedTabs
        tabs={[...CATEGORIES]}
        activeTab={selectedCategory}
        onChangeTab={(tab) => onSelectCategory(tab as CategoryType)}
        scrollable={true}
      />
    </View>
  );
};

export default CategoryFilter;
