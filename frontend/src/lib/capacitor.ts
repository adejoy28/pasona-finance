import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export function initCapacitor() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // Configure Status Bar styling for Android
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#1B2D6B' }).catch(() => {});

  // Handle Hardware Back Button on Android
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      void CapApp.minimizeApp();
    }
  });
}
