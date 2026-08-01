import { cn } from "@/lib/utils";

/**
 * Floating WhatsApp chat button.
 * Mirrors the back-to-top styling and sits on the opposite (left) side.
 * Hidden until a verified support number is configured for the deployment.
 */
const WHATSAPP_NUMBER = (import.meta.env.VITE_PUBLIC_WHATSAPP_NUMBER as string | undefined)
  ?.replace(/\D/g, "");

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.9c0 2.09.55 4.13 1.6 5.93L2 22l4.32-1.13a9.9 9.9 0 0 0 5.71 1.82h.01c5.46 0 9.91-4.45 9.91-9.9C21.95 6.45 17.5 2 12.04 2Zm5.79 14.06c-.25.7-1.44 1.34-1.99 1.4-.53.06-1.2.08-1.94-.12-.45-.13-1.02-.31-1.76-.63-3.1-1.34-5.13-4.47-5.29-4.68-.15-.2-1.27-1.69-1.27-3.23s.81-2.3 1.09-2.6c.28-.31.62-.39.83-.39l.6.01c.19.01.45-.07.7.53.25.62.87 2.13.94 2.28.08.15.13.32.02.53-.11.2-.16.32-.31.5-.15.18-.32.4-.46.54-.15.15-.31.31-.13.61.18.31.79 1.31 1.7 2.12 1.17 1.03 2.15 1.35 2.46 1.5.31.15.5.13.68-.08.19-.2.79-.92.99-1.24.2-.31.4-.26.68-.16.28.11 1.79.85 2.09.99.31.15.51.22.59.35.08.13.08.72-.18 1.41Z" />
    </svg>
  );
}

export function WhatsAppChat() {
  if (!WHATSAPP_NUMBER) return null;
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={cn(
        "fixed z-40 grid h-12 w-12 place-items-center rounded-full bg-primary shadow-lg backdrop-blur border border-primary/60 transition-all duration-300 hover:scale-105 active:scale-95",
        "left-4 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] md:bottom-6",
      )}
    >
      <WhatsAppIcon className="h-6 w-6 text-primary-foreground" />
    </a>
  );
}
