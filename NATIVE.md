# Native mobile (iOS + Android)

Beistand ships as a real native app via **Capacitor**, wrapping the same
TanStack Start web app. No rewrites — the native shell loads the live web
build, so every deploy updates the app instantly.

## What's already wired

- `capacitor.config.ts` — app id `app.lovable.beistand`, Ocean Deep splash + status bar.
- `src/lib/native.ts` — safe boot (splash hide, status bar theming, keyboard resize, Android back button, haptics, share sheet). No-op on the web.
- `src/styles.css` — `env(safe-area-inset-*)` padding for notches, keyboard-open handling.
- Installed plugins: `@capacitor/app`, `haptics`, `keyboard`, `preferences`, `network`, `share`, `splash-screen`, `status-bar`.

## Add the native platforms (run locally, not in Lovable)

```bash
# 1. Clone your project from GitHub (Lovable → GitHub → Connect Repo)
git clone <your-repo> && cd <your-repo>
bun install

# 2. Add platforms (iOS needs macOS + Xcode 15+; Android needs Android Studio)
npx cap add ios
npx cap add android

# 3. Sync web assets + native plugin config
npx cap sync

# 4. Run on device / simulator
npx cap run ios         # opens Xcode
npx cap run android     # opens Android Studio
```

## Dev vs production

- **Dev / preview**: `capacitor.config.ts` has `server.url` pointing at the
  Lovable preview — the app hot-loads from there, so every code change
  appears on the device immediately (no rebuild).
- **Production / App Store**: before shipping, either
  1. change `server.url` to your custom domain (e.g. `https://beistand.app`), or
  2. remove `server.url` entirely and ship a static bundle:
     ```bash
     bun run build
     npx cap copy
     npx cap open ios     # archive & upload via Xcode
     npx cap open android # signed AAB via Android Studio
     ```

## Using native features from React

```ts
import { tap, share, isNative } from "@/lib/native";

<button onClick={() => { tap("light"); doThing(); }}>…</button>

await share({ title: "Case 42", url: "https://beistand.app/cases/42" });
```

## Push notifications, camera, biometrics

Add on demand:

```bash
bun add @capacitor/push-notifications @capacitor/camera @capacitor-community/biometric-auth
npx cap sync
```

Then guard every call with `isNative()` so the web build keeps working.
