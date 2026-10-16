import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pasona.finance',
  appName: 'Pasona Finance',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'http://192.168.137.1:5173',

    // If testing on a Physical Phone (connected via USB/Wi-Fi):
    // url: 'http://192.168.x.x:5173', // (replace with your computer's local IP from step 1)
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B1434',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_pasona',
      iconColor: '#101b45',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
