import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

/** Follow-us social icons for the site footer. Handles are placeholders — swap for real accounts. */
export const SOCIALS = [
  { name: "Facebook",  href: "https://facebook.com/beistand.de",  Icon: Facebook },
  { name: "Instagram", href: "https://instagram.com/beistand.de", Icon: Instagram },
  { name: "LinkedIn",  href: "https://linkedin.com/company/beistand-gmbh", Icon: Linkedin },
  { name: "YouTube",   href: "https://youtube.com/@beistand",     Icon: Youtube },
  { name: "X",         href: "https://x.com/beistand_de",         Icon: XIcon },
] as const;

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
