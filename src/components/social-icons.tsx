import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

/**
 * Follow-us social icons for the site footer. Each profile URL is configured via
 * env (VITE_PUBLIC_*_URL); channels without a configured URL are not rendered,
 * so no placeholder link ever ships.
 */
export const SOCIALS = [
  { name: "Facebook", href: import.meta.env.VITE_PUBLIC_FACEBOOK_URL, Icon: Facebook },
  { name: "Instagram", href: import.meta.env.VITE_PUBLIC_INSTAGRAM_URL, Icon: Instagram },
  { name: "LinkedIn", href: import.meta.env.VITE_PUBLIC_LINKEDIN_URL, Icon: Linkedin },
  { name: "YouTube", href: import.meta.env.VITE_PUBLIC_YOUTUBE_URL, Icon: Youtube },
  { name: "X", href: import.meta.env.VITE_PUBLIC_X_URL, Icon: XIcon },
].filter((s): s is { name: string; href: string; Icon: typeof Facebook } =>
  typeof s.href === "string" && s.href.startsWith("http"),
);

/** Lucide doesn't ship a mono "X" mark, so we render one inline to match the set. */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.828l-4.77-6.24L4.8 22H2l6.98-7.98L2 2h6.914l4.32 5.72L18.244 2Zm-2.39 18h1.884L8.24 4H6.24l9.614 16Z" />
    </svg>
  );
}

export function SocialIcons({ variant = "footer" }: { variant?: "footer" | "share" }) {
  const isFooter = variant === "footer";
  if (SOCIALS.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2">
      {SOCIALS.map(({ name, href, Icon }) => (
        <li key={name}>
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={name}
            className={
              isFooter
                ? "grid h-9 w-9 place-items-center rounded-full border border-border/60 text-foreground/70 transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                : "grid h-9 w-9 place-items-center rounded-full bg-muted text-foreground/70 transition hover:bg-primary hover:text-primary-foreground"
            }
          >
            <Icon className="h-4 w-4" />
          </a>
        </li>
      ))}
    </ul>
  );
}
