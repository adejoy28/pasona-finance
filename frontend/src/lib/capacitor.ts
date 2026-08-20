import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

export function initCapacitor() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // Configure Status Bar styling for Android
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#1B2D6B' }).catch(() => {});

  // Initialize Google Sign-In
  GoogleSignIn.initialize({
    clientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || 'YOUR_WEB_CLIENT_ID_FROM_GOOGLE',
  }).catch(console.error);

  // Handle Hardware Back Button on Android
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      void CapApp.minimizeApp();
    }
  });
}
