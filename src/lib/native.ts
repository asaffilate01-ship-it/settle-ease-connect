/**
 * Native runtime bridge for the Capacitor shell.
 *
 * Safe to call in the browser — every plugin call is guarded by
 * `Capacitor.isNativePlatform()` so the web build is a no-op.
 */
import { Capacitor } from "@capacitor/core";

export const isNative = () =>
  typeof window !== "undefined" && Capacitor.isNativePlatform();

export const nativePlatform = () =>
  typeof window === "undefined" ? "web" : Capacitor.getPlatform();

/** One-shot boot: splash hide, status bar theming, keyboard, back button. */
export async function initNative(onBack?: () => boolean | void) {
  if (!isNative()) return;

  try {
    const [{ SplashScreen }, { StatusBar, Style }, { Keyboard }, { App }] =
      await Promise.all([
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
      document.documentElement.style.setProperty(
        "--keyboard-height",
        `${info.keyboardHeight}px`,
      );
      document.documentElement.classList.add("keyboard-open");
    }).catch(() => {});
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.setProperty("--keyboard-height", "0px");
      document.documentElement.classList.remove("keyboard-open");
    }).catch(() => {});

    App.addListener("backButton", ({ canGoBack }) => {
      const handled = onBack?.();
      if (handled) return;
      if (canGoBack) window.history.back();
      else App.exitApp();
    }).catch(() => {});

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
export async function share(payload: {
  title?: string;
  text?: string;
  url?: string;
}) {
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
