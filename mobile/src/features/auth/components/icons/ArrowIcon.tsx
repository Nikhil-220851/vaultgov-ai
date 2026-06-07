import React from 'react';
import { FontAwesome6 } from '@expo/vector-icons';

interface IconProps {
  isPrimary?: boolean;
}

export function ArrowIcon({ isPrimary = false }: IconProps) {
  return (
    <FontAwesome6
      name="chevron-right"
      size={12}
      color={isPrimary ? '#FFFFFF' : '#1977F3'}
    />
  );
}
