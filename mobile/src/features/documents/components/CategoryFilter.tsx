import React from 'react';
import { View } from 'react-native';
import { styles } from '../documents.styles';
import { SegmentedTabs } from '@/components/SegmentedTabs';
export type CategoryType = string | 'All';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.categoriesContainer}>
      <SegmentedTabs
        tabs={['All', ...categories]}
        activeTab={selectedCategory}
        onChangeTab={(tab) => onSelectCategory(tab as CategoryType)}
        scrollable={true}
      />
    </View>
  );
};

export default CategoryFilter;
