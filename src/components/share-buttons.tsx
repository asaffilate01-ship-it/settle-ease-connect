import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Facebook, Linkedin, Link2, Mail, Check } from "lucide-react";

type Props = {
  url: string;
  title: string;
};

/** Share bar for blog posts — opens standard share intents in a new tab and copies the link. */
export function ShareButtons({ url, title }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const absolute =
    typeof window !== "undefined" && url.startsWith("/")
      ? `${window.location.origin}${url}`
      : url;

  const encodedUrl = encodeURIComponent(absolute);
  const encodedTitle = encodeURIComponent(title);

  const links: { name: string; href: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      Icon: Facebook,
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      Icon: Linkedin,
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      Icon: XMark,
    },
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      Icon: WhatsApp,
    },
    {
      name: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      Icon: Mail,
    },
  ];

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="me-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {t("blog.share")}
      </span>
      {links.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={t("blog.shareOn", { network: name })}
          className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground/70 transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={onCopy}
        aria-label={t("blog.copyLink")}
        className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground/70 transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
      </button>
      {copied && <span className="text-xs text-success">{t("blog.copied")}</span>}
    </div>
  );
}

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.828l-4.77-6.24L4.8 22H2l6.98-7.98L2 2h6.914l4.32 5.72L18.244 2Zm-2.39 18h1.884L8.24 4H6.24l9.614 16Z" />
    </svg>
  );
}

function WhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.9c0 2.09.55 4.13 1.6 5.93L2 22l4.32-1.13a9.9 9.9 0 0 0 5.71 1.82h.01c5.46 0 9.91-4.45 9.91-9.9C21.95 6.45 17.5 2 12.04 2Zm5.79 14.06c-.25.7-1.44 1.34-1.99 1.4-.53.06-1.2.08-1.94-.12-.45-.13-1.02-.31-1.76-.63-3.1-1.34-5.13-4.47-5.29-4.68-.15-.2-1.27-1.69-1.27-3.23s.81-2.3 1.09-2.6c.28-.31.62-.39.83-.39l.6.01c.19.01.45-.07.7.53.25.62.87 2.13.94 2.28.08.15.13.32.02.53-.11.2-.16.32-.31.5-.15.18-.32.4-.46.54-.15.15-.31.31-.13.61.18.31.79 1.31 1.7 2.12 1.17 1.03 2.15 1.35 2.46 1.5.31.15.5.13.68-.08.19-.2.79-.92.99-1.24.2-.31.4-.26.68-.16.28.11 1.79.85 2.09.99.31.15.51.22.59.35.08.13.08.72-.18 1.41Z" />
    </svg>
  );
}
