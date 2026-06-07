export type AuthIconType = 'google' | 'otp';

export interface AuthButtonProps {
  title: string;
  iconType: AuthIconType;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface AuthUser {
  id: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: AuthUser;
}
