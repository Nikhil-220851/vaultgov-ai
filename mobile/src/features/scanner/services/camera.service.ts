import { Camera } from 'expo-camera';

/**
 * Checks if the app currently has camera permissions.
 */
export async function checkCameraPermission(): Promise<boolean> {
  try {
    const { status } = await Camera.getCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[ScannerCameraService] Error checking permission:', error);
    return false;
  }
}

/**
 * Requests camera permission from the user.
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[ScannerCameraService] Error requesting permission:', error);
    return false;
  }
}
