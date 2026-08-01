import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the Beistand native shell (iOS + Android).
 *
 * Strategy: the native app is a thin shell around the same TanStack Start
 * web app. In development we point `server.url` at the Lovable preview so
 * every code change ships to the device instantly. For production builds
 * change `server.url` to your custom domain (or remove it and run
 * `bun run build && npx cap copy` to embed a static bundle in `webDir`).
 */
const config: CapacitorConfig = {
  appId: "app.lovable.beistand",
  appName: "Beistand",
  webDir: "dist/client",
  server: {
    url: "https://id-preview--3f46c97f-04a4-4979-bb65-a197320d0525.lovable.app",
    cleartext: true,
    androidScheme: "https",
    allowNavigation: [
      "*.lovable.app",
      "*.lovableproject.com",
      "*.supabase.co",
      "fonts.googleapis.com",
      "fonts.gstatic.com",
    ],
  },
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#001B2E",
  },
  android: {
    backgroundColor: "#001B2E",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#001B2E",
      showSpinner: false,
      androidSplashResourceName: "splash",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#001B2E",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
