import { useEffect, useState, useCallback } from "react";

// Chrome/Edge/Android fire "beforeinstallprompt" when the PWA installability
// criteria are met (manifest + service worker + HTTPS). Safari/iOS never fires
// this event — there, installation is manual via the Share sheet, so callers
// should show static instructions instead when isSupported is false.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa_install_dismissed_at";
const DISMISS_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setInstalled(isStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const dismissedRecently = (() => {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_SNOOZE_MS;
  })();

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  }, [deferredEvent]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setDeferredEvent(null);
  }, []);

  return {
    canInstall: !!deferredEvent && !installed && !dismissedRecently,
    installed,
    promptInstall,
    dismiss,
  };
}
