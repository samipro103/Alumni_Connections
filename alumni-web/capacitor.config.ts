/// <reference types="@capacitor/push-notifications" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alumniconnections.app',
  appName: 'AlumniConnections',
  webDir: 'mobile-shell',

  server: {
    url: 'https://alumni-connections.vercel.app',
  },

  plugins: {
    PushNotifications: {
      presentationOptions: [
        'badge',
        'sound',
        'alert',
        'banner',
        'list',
      ],
    },
  },
};

export default config;
