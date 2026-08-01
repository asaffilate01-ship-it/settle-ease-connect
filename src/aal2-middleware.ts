import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import type { ComponentType } from "react";

type SocialLink = {
  name: string;
  href?: string;
  Icon: ComponentType<{ className?: string }>;
};

/** Only render social profiles that are explicitly configured for deployment. */
const configuredSocials: SocialLink[] = [
  { name: "Facebook", href: import.meta.env.VITE_PUBLIC_FACEBOOK_URL as string | undefined, Icon: Facebook },
  { name: "Instagram", href: import.meta.env.VITE_PUBLIC_INSTAGRAM_URL as string | undefined, Icon: Instagram },
  { name: "LinkedIn", href: import.meta.env.VITE_PUBLIC_LINKEDIN_URL as string | undefined, Icon: Linkedin },
  { name: "YouTube", href: import.meta.env.VITE_PUBLIC_YOUTUBE_URL as string | undefined, Icon: Youtube },
  { name: "X", href: import.meta.env.VITE_PUBLIC_X_URL as string | undefined, Icon: XIcon },
];

export const SOCIALS = configuredSocials.filter(
  (social): social is SocialLink & { href: string } => Boolean(social.href),
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
