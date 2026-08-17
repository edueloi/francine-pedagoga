import { useEffect, useRef } from "react";

// Keeps a hook's data fresh without the user having to hit F5: refetches as
// soon as the tab regains focus/visibility (covers "a coworker created an
// appointment/patient on another computer while I had this tab open") and on
// a background interval while the tab stays open and visible, as a safety net
// for long idle sessions left on screen (e.g. a reception desk display).
export function useAutoRefresh(reload: () => void | Promise<void>, intervalMs = 25000, enabled = true) {
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useEffect(() => {
    if (!enabled) return;

    const onFocus = () => {
      reloadRef.current();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") reloadRef.current();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") reloadRef.current();
    }, intervalMs);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, [intervalMs, enabled]);
}
