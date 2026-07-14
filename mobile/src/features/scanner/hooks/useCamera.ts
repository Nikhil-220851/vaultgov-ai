import { useState, useEffect, useCallback } from 'react';
import { Camera } from 'expo-camera';

export type FlashMode = 'off' | 'on' | 'auto';

export function useCamera() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const checkPermission = useCallback(async () => {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (err) {
      console.error('[useCamera] Check permission error:', err);
      setHasPermission(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (err) {
      console.error('[useCamera] Request permission error:', err);
      setHasPermission(false);
      return false;
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkPermission();
  }, [checkPermission]);

  const toggleFlash = useCallback(() => {
    setFlash((prev) => {
      if (prev === 'off') {
        console.log('[useCamera] Flash mode: ON');
        return 'on';
      }
      if (prev === 'on') {
        console.log('[useCamera] Flash mode: AUTO');
        return 'auto';
      }
      console.log('[useCamera] Flash mode: OFF');
      return 'off';
    });
  }, []);

  return {
    hasPermission,
    flash,
    setFlash,
    isCameraReady,
    setIsCameraReady,
    isCapturing,
    setIsCapturing,
    requestPermission,
    toggleFlash,
  };
}
