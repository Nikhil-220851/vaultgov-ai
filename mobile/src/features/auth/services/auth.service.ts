import { AuthResponse } from '../types/auth.types';

/**
 * Authentication Service for VaultGov.
 * Contains stubs for Google Sign-In and OTP-based authentication.
 */
export const AuthService = {
  /**
   * Initiates authentication using Google Sign-In.
   * TODO: Implement production Google OAuth authentication.
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          user: {
            id: 'mock-google-uid-12345',
            email: 'user@vaultgov.gov',
            displayName: 'Citizen User',
          },
        });
      }, 800); // 800ms delay to show the premium loading state
    });
  },

  /**
   * Initiates authentication using OTP.
   * TODO: Implement production One-Time Password validation.
   */
  async signInWithOTP(): Promise<AuthResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          user: {
            id: 'mock-otp-uid-67890',
            phoneNumber: '+15550199',
            displayName: 'Citizen User',
          },
        });
      }, 800); // 800ms delay to show the premium loading state
    });
  },
};
