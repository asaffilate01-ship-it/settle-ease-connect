import type { CapacitorConfig } from "@capacitor/cli";

const configuredServerUrl = process.env.CAPACITOR_SERVER_URL?.trim();
const serverUrl = configuredServerUrl ? new URL(configuredServerUrl) : null;

if (serverUrl && serverUrl.protocol !== "https:") {
  throw new Error("CAPACITOR_SERVER_URL must use HTTPS");
}

/**
 * Production mobile strategy: a signed Capacitor shell loads the deployed
 * TanStack Start application from CAPACITOR_SERVER_URL. TanStack Start is an
 * SSR application, so it cannot be copied into Capacitor as a static bundle.
 * `native-shell` is a small, local fail-safe shown only when no server URL was
 * supplied at sync/build time.
 */
const config: CapacitorConfig = {
  appId: "de.beistandplus.app",
  appName: "BeistandPlus",
  webDir: "native-shell",
  ...(serverUrl && {
    server: {
      url: serverUrl.origin,
      cleartext: false,
      androidScheme: "https",
      allowNavigation: [serverUrl.hostname],
    },
  }),
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
      backgroundColor: "#FFFFFF",
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
