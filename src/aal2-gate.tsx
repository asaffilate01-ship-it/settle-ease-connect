import { useEffect, useState } from "react";
import logoMark from "@/assets/brand/logo-mark.png";
import { cn } from "@/lib/utils";

/**
 * First-paint splash overlay with the logo mark.
 * Shows on initial load, fades out after hydration.
 * Session-scoped so it doesn't flash on every client-side nav.
 */
export function AppSplash() {
  const [mounted, setMounted] = useState(false);
  const [gone, setGone] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (sessionStorage.getItem("bp.splash.seen") === "1") {
          setShow(false);
          setGone(true);
          return;
        }
      } catch {
        /* ignore */
      }
    }
    setMounted(true);
    const fadeTimer = setTimeout(() => {
      setShow(false);
      try {
        sessionStorage.setItem("bp.splash.seen", "1");
      } catch {
        /* ignore */
      }
    }, 700);
    const removeTimer = setTimeout(() => setGone(true), 1300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden={!show}
      className={cn(
        "fixed inset-0 z-[100] grid place-items-center bg-parchment transition-opacity duration-500",
        show && mounted ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <img
            src={logoMark}
            alt="BeistandPlus"
            className="relative h-20 w-20 object-contain drop-shadow-md"
          />
        </div>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-[splash-slide_1.1s_ease-in-out_infinite] rounded-full bg-gradient-primary" />
        </div>
      </div>
      <style>{`@keyframes splash-slide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
    </div>
  );
}
