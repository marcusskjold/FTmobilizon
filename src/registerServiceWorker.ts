import { register } from "register-service-worker";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  register(`${import.meta.env.BASE_URL}service-worker.js`, {
    ready() {
      console.debug(
        "App is being served from cache by a service worker.\n" +
          "For more details, visit https://goo.gl/AFskqB"
      );
    },
    registered() {
      console.debug("Service worker has been registered.");
    },
    cached() {
      console.debug("Content has been cached for offline use.");
    },
    updatefound() {
      console.debug("New content is downloading.");
    },
    updated(registration: ServiceWorkerRegistration) {
      const installingWorker = registration.installing;
      if (installingWorker) {
        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              console.debug(
                "New content is available, and the new service worker is now active."
              );
              installingWorker.postMessage({ type: "skip-waiting" });
            } else {
              console.debug("Content is cached for offline use.");
            }
          }
        };
      }
    },
    offline() {
      console.debug(
        "No internet connection found. App is running in offline mode."
      );
    },
    error(error) {
      console.error("Error during service worker registration:", error);
    },
  });
}
