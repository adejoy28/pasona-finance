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
  StatusBar.setBackgroundColor({ color: '#0B1434' }).catch(() => {});

  // Initialize Google Sign-In
  GoogleSignIn.initialize({
    clientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || '247677231726-c7h2ccu3kqoje3bfdm2vj02pj7o7vd65.apps.googleusercontent.com',
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
