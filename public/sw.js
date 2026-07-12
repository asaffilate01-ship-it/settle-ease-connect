// BeistandPlus web-push service worker.
// Push-only — no app-shell caching. Safe to keep registered across releases.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "BeistandPlus", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "BeistandPlus";
  const options = {
    body: payload.body || "",
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: payload.tag || payload.kind || "beistandplus",
    data: { url: payload.link || payload.url || "/app", ...payload.data },
    requireInteraction: !!payload.requireInteraction,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/app";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          try {
            await client.focus();
            if ("navigate" in client) await client.navigate(url);
            return;
          } catch {
            /* fall through */
          }
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
