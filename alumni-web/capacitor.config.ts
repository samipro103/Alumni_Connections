/// <reference types="@capacitor/push-notifications" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alumniconnections.app',
  appName: 'Alumni',
  webDir: 'mobile-shell',

  server: {
    url: 'https://alumnisv.com',
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

/* ALUMNI_2_9_5_OFFICIAL_DOMAIN */

/* ALUMNI_3_5_0_NATIVE_EXPERIENCE */
