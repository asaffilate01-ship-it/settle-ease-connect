/**
 * Native runtime bridge for the Capacitor shell.
 *
 * Safe to call in the browser — every plugin call is guarded by
 * `Capacitor.isNativePlatform()` so the web build is a no-op.
 */
import { Capacitor } from "@capacitor/core";

export const isNative = () => typeof window !== "undefined" && Capacitor.isNativePlatform();

export const nativePlatform = (): "web" | "ios" | "android" => {
  if (typeof window === "undefined") return "web";
  const platform = Capacitor.getPlatform();
  return platform === "ios" || platform === "android" ? platform : "web";
};

export type NativePushRegistration = {
  platform: "ios" | "android";
  deviceToken: string;
};

export const nativePushConfigured = import.meta.env.VITE_NATIVE_PUSH_ENABLED === "true";

const ALLOWED_DEEP_LINK_PREFIXES = [
  "/app",
  "/portal",
  "/agent",
  "/expert",
  "/auth",
  "/checkout/return",
  "/family-invite/",
  "/expert-invite/",
] as const;

/** Convert an app-owned HTTPS/custom-scheme URL to a safe in-app route. */
export function resolveNativeDeepLink(rawUrl: string, appOrigin?: string): string | null {
  try {
    const url = new URL(rawUrl);
    let route: string;
    if (url.protocol === "beistandplus:") {
      if (!url.hostname || !["app", "portal", "agent", "expert", "auth"].includes(url.hostname)) {
        return null;
      }
      route = `/${url.hostname}${url.pathname === "/" ? "" : url.pathname}${url.search}${url.hash}`;
    } else if (url.protocol === "https:") {
      const allowedOrigin =
        appOrigin ?? (typeof window !== "undefined" ? window.location.origin : "");
      if (!allowedOrigin || url.origin !== allowedOrigin) return null;
      route = `${url.pathname}${url.search}${url.hash}`;
    } else {
      return null;
    }
    if (route.includes("\\") || /(^|\/)\.\.?($|\/)/.test(route)) return null;
    return ALLOWED_DEEP_LINK_PREFIXES.some(
      (prefix) =>
        route === prefix || route.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`),
    )
      ? route
      : null;
  } catch {
    return null;
  }
}

/** Ask for notification permission after a user gesture and return the native
 * APNs/FCM registration token. Platform credentials still need to be added to
 * the generated Xcode and Android projects before store release. */
export async function registerNativePushToken(): Promise<NativePushRegistration | null> {
  const platform = nativePlatform();
  if (!isNative() || (platform !== "ios" && platform !== "android")) return null;

  const { PushNotifications } = await import("@capacitor/push-notifications");
  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === "prompt") {
    permission = await PushNotifications.requestPermissions();
  }
  if (permission.receive !== "granted") return null;

  return new Promise<NativePushRegistration>((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(
      () => finish(new Error("Native push registration timed out")),
      15_000,
    );
    const finish = (result: NativePushRegistration | Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (result instanceof Error) reject(result);
      else resolve(result);
    };

    void PushNotifications.addListener("registration", (token) => {
      finish({ platform, deviceToken: token.value });
    });
    void PushNotifications.addListener("registrationError", (error) => {
      finish(new Error(error.error || "Native push registration failed"));
    });
    void PushNotifications.register().catch((error: unknown) => {
      finish(error instanceof Error ? error : new Error(String(error)));
    });
  });
}

/** One-shot boot: splash, deep links, notification actions, keyboard and back. */
export async function initNative(options?: {
  onBack?: () => boolean | void;
  onDeepLink?: (route: string) => void;
}) {
  if (!isNative()) return;

  try {
    const [{ SplashScreen }, { StatusBar, Style }, { Keyboard }, { App }] = await Promise.all([
      import("@capacitor/splash-screen"),
      import("@capacitor/status-bar"),
      import("@capacitor/keyboard"),
      import("@capacitor/app"),
    ]);

    // Match the Ocean Deep palette.
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    if (nativePlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#001B2E" }).catch(() => {});
    }

    // Add a class so CSS can pad for the notch/status bar.
    document.documentElement.classList.add("native");
    document.documentElement.classList.add(`native-${nativePlatform()}`);

    Keyboard.addListener("keyboardWillShow", (info) => {
      document.documentElement.style.setProperty("--keyboard-height", `${info.keyboardHeight}px`);
      document.documentElement.classList.add("keyboard-open");
    }).catch(() => {});
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.setProperty("--keyboard-height", "0px");
      document.documentElement.classList.remove("keyboard-open");
    }).catch(() => {});

    App.addListener("backButton", ({ canGoBack }) => {
      const handled = options?.onBack?.();
      if (handled) return;
      if (canGoBack) window.history.back();
      else App.exitApp();
    }).catch(() => {});

    App.addListener("appUrlOpen", ({ url }) => {
      const route = resolveNativeDeepLink(url);
      if (route) options?.onDeepLink?.(route);
    }).catch(() => {});

    if (nativePushConfigured) {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
        const data = notification.data as Record<string, unknown> | undefined;
        const raw =
          typeof data?.link === "string"
            ? data.link
            : typeof data?.url === "string"
              ? data.url
              : null;
        if (!raw) return;
        const route = raw.startsWith("/")
          ? resolveNativeDeepLink(new URL(raw, window.location.origin).toString())
          : resolveNativeDeepLink(raw);
        if (route) options?.onDeepLink?.(route);
      }).catch(() => {});
    }

    // Hide splash after first paint.
    setTimeout(() => SplashScreen.hide().catch(() => {}), 400);
  } catch (err) {
    console.warn("[native] init failed", err);
  }
}

/** Light tactile feedback for buttons / row taps. */
export async function tap(style: "light" | "medium" | "heavy" = "light") {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    } as const;
    await Haptics.impact({ style: map[style] });
  } catch {
    /* noop on web */
  }
}

/** Native share sheet with graceful web fallback. */
export async function share(payload: { title?: string; text?: string; url?: string }) {
  if (isNative()) {
    const { Share } = await import("@capacitor/share");
    await Share.share(payload);
    return;
  }
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await (navigator as Navigator).share(payload);
    } catch {
      /* user cancelled */
    }
  }
}

/** Open an HTTPS destination outside the app WebView. */
export async function openExternalUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error("Only secure HTTPS links can be opened.");
  if (isNative()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: url.toString(), presentationStyle: "popover" });
    return;
  }
  const opened = window.open(url.toString(), "_blank", "noopener,noreferrer");
  if (opened) opened.opener = null;
}
