import React from 'react';
import { FontAwesome6 } from '@expo/vector-icons';

interface IconProps {
  isPrimary?: boolean;
}

export function PhoneIcon({ isPrimary = false }: IconProps) {
  return (
    <FontAwesome6
      name="mobile-screen-button"
      size={18}
      color={isPrimary ? '#FFFFFF' : '#1977F3'}
    />
  );
}
