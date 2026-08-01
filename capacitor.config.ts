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
const isDevShell = process.env["CAP_DEV_SERVER"] === "1";

const config: CapacitorConfig = {
  appId: "de.beistandplus.app",
  appName: "BeistandPlus",
  webDir: "dist/client",
  // Production ships the bundled web build (`bun run build && npx cap copy`).
  // Set CAP_DEV_SERVER=1 to live-reload from the hosted app instead.
  ...(isDevShell
    ? {
        server: {
          url: "https://beistandplus.313test.co.uk",
          cleartext: false,
          androidScheme: "https" as const,
          allowNavigation: [
            "beistandplus.313test.co.uk",
            "*.lovable.app",
            "*.supabase.co",
            "fonts.googleapis.com",
            "fonts.gstatic.com",
          ],
        },
      }
    : {}),
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
