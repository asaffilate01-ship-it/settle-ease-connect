# Native iOS and Android release guide

## Architecture

BeistandPlus uses one shared React/TanStack Start codebase. Because the web application uses server rendering and server functions, Capacitor loads the deployed HTTPS application set by `CAPACITOR_SERVER_URL`; it is not a static `dist` bundle. `native-shell/index.html` is a local fail-safe shown when a build is synced without a server URL.

Generated projects are committed in `ios/` and `android/`. The application ID is `de.beistandplus.app` and the display name is `BeistandPlus`.

## Sync a production domain

```bash
export CAPACITOR_SERVER_URL=https://beistandplus.de
npm run mobile:sync
```

The validator rejects HTTP and Lovable preview domains. Re-run the command whenever Capacitor plugins or `capacitor.config.ts` change. Verify the domain is deployed, uses a valid TLS certificate, and serves the exact reviewed release before building a store binary.

## Native features already wired

- Branded iOS/Android icons and splash screens
- Safe-area, keyboard, status-bar, Android back-button, haptic and share bridges
- Rear-camera document capture through the file picker
- User-initiated APNs/FCM token registration
- Optional HTTPS native-push delivery gateway
- Cleartext traffic disabled and Android application backups disabled
- Stripe subscription checkout and billing management blocked inside native apps

Native push remains hidden unless `VITE_NATIVE_PUSH_ENABLED=true`. When enabled, configure `NATIVE_PUSH_DELIVERY_ENDPOINT` and `NATIVE_PUSH_DELIVERY_BEARER_TOKEN`; the gateway receives a bounded JSON request containing platform, device token and notification payload.

## iOS completion

1. Use macOS with the current stable Xcode supported by Capacitor 8.
2. Open `ios/App/App.xcodeproj`, select the correct Apple Developer team and confirm bundle ID `de.beistandplus.app`.
3. Add the Push Notifications capability and the appropriate APNs entitlement if push is enabled.
4. Configure APNs credentials in the deployment-owned native-push gateway.
5. Confirm version/build numbers, privacy manifest/labels, support URL, privacy-policy URL and App Store screenshots.
6. Test camera selection, MFA, deep links, session expiry, offline/reconnect, notification handling and account deletion on real iPhone/iPad devices.
7. Archive, upload to TestFlight, complete external testing, then submit for review.

## Android completion

1. Open `android/` in the current stable Android Studio supported by Capacitor 8.
2. Create a Firebase Android app for `de.beistandplus.app` and add the production `google-services.json` if push is enabled. Do not commit credential-bearing files unless your security policy explicitly permits it.
3. Configure FCM credentials in the deployment-owned native-push gateway.
4. Create and securely store the upload/release keystore outside Git; configure Play App Signing.
5. Confirm version code/name, data-safety disclosure, content rating, privacy policy, screenshots and store listing.
6. Test camera selection, MFA, deep links, session expiry, offline/reconnect and notification handling on physical devices.
7. Produce a signed Android App Bundle and complete closed testing before production rollout.

## Store-review decisions

The mobile app currently supports existing memberships but does not show Stripe checkout or the Stripe billing portal in the native WebView. Before enabling digital subscription purchases, implement and obtain review for the applicable StoreKit/Google Play Billing or permitted entitlement model. Also prepare review notes demonstrating native utility (camera capture, push, haptics, secure vault and case workflows); a simple repackaged website can be rejected.

Signing certificates, store accounts, APNs/FCM credentials, legal disclosures and store approval are external release inputs and are not included in source control.
