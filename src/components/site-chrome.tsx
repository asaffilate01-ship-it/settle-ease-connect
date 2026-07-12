import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const navLinks: [string, string][] = [
    [t("nav.howItWorks"), "/how-it-works"],
    [t("nav.services"), "/services"],
    [t("nav.directory"), "/directory"],
    [t("nav.bereavement"), "/bereavement"],
    [t("nav.forProviders"), "/for-providers"],
    [t("nav.pricing"), "/pricing"],
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
            <span className="font-display text-lg font-semibold">B</span>
          </div>
          <div className="leading-tight">
            <div className="font-display text-xl font-semibold tracking-tight">Beistand</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("brand.location")}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map(([label, href]) => (
            <Link key={href + label} to={href} className="text-sm text-foreground/80 hover:text-foreground">
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <Button asChild variant="ghost" size="sm">
            <Link to="/app">{t("nav.signIn")}</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-primary shadow-soft">
            <Link to="/app">{t("nav.openDashboard")}</Link>
          </Button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={t("nav.menu")}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="flex flex-col gap-1 p-4">
            {navLinks.map(([label, href]) => (
              <Link key={href + label} to={href} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                {label}
              </Link>
            ))}
            <div className="mt-2">
              <LanguageSwitcher />
            </div>
            <Button asChild className="mt-2 bg-gradient-primary">
              <Link to="/app">{t("nav.openDashboard")}</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border/60 bg-parchment/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
              <span className="font-display text-lg font-semibold">B</span>
            </div>
            <div className="font-display text-xl font-semibold">Beistand</div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">{t("footer.tagline")}</p>
        </div>
        <FooterCol
          title={t("footer.colPlatform")}
          links={[
            [t("footer.howItWorks"), "/how-it-works"],
            [t("footer.services"), "/services"],
            [t("footer.bereavement"), "/bereavement"],
            [t("footer.pricing"), "/pricing"],
          ]}
        />
        <FooterCol
          title={t("footer.colForProviders")}
          links={[
            [t("footer.funeralDirectors"), "/for-providers"],
            [t("footer.mosques"), "/for-providers"],
            [t("footer.churches"), "/for-providers"],
            [t("footer.temples"), "/for-providers"],
          ]}
        />
        <FooterCol
          title={t("footer.colCompany")}
          links={[
            [t("footer.contact"), "/contact"],
            [t("footer.impressum"), "/contact"],
            [t("footer.privacy"), "/contact"],
          ]}
        />
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>{t("footer.copyright", { year: new Date().getFullYear() })}</div>
          <div>{t("footer.madeWithCare")}</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
        {title}
      </div>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([label, href]) => (
          <li key={label + href}>
            <Link to={href} className="text-muted-foreground hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
