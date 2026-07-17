// Minimal service worker: handles incoming push notifications and taps on them.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Savar Blood", body: event.data.text() };
  }

  const { title = "Savar Blood", body = "", url = "/" } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
