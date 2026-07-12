import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChevronRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SocialIcons } from "@/components/social-icons";
import logoMark from "@/assets/brand/logo-mark.png";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const navLinks: [string, string][] = [
    [t("nav.howItWorks"), "/how-it-works"],
    [t("nav.services"), "/services"],
    [t("nav.directory"), "/directory"],
    [t("nav.bereavement"), "/bereavement"],
    [t("nav.students", "Students"), "/students"],
    [t("nav.forProviders"), "/for-providers"],
    [t("nav.pricing"), "/pricing"],
    [t("nav.blog"), "/blog"],
  ];

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img
            src={logoMark}
            alt="BeistandPlus"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div data-no-translate className="truncate font-display text-xl font-semibold tracking-tight">
            Beistand<span className="text-success">Plus</span>
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

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border/60 bg-background/80 text-foreground shadow-soft transition active:scale-95 md:hidden"
              aria-label={t("nav.menu")}
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="safe-top w-full max-w-full border-0 bg-background/95 p-0 backdrop-blur-2xl sm:max-w-sm [&>button.absolute]:hidden"
          >
            <div className="flex h-full flex-col">
              {/* Sheet header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                  <img src={logoMark} alt="BeistandPlus" className="h-9 w-9 object-contain" />
                  <span data-no-translate className="font-display text-lg font-semibold">
                    Beistand<span className="text-success">Plus</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("nav.close", "Close")}
                  className="grid h-10 w-10 place-items-center rounded-full bg-muted/70 text-foreground/80 transition active:scale-95"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable link list — big native-style rows */}
              <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
                <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-card/70">
                  {navLinks.map(([label, href]) => (
                    <li key={href + label}>
                      <Link
                        to={href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-3 px-4 py-4 text-[15px] font-medium text-foreground transition active:bg-muted/80"
                      >
                        <span className="truncate">{label}</span>
                        <ChevronRight className="rtl-flip h-5 w-5 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-2xl border border-border/60 bg-card/70 p-3">
                  <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {t("language.label")}
                  </div>
                  <LanguageSwitcher />
                </div>

                <div className="mt-5 flex items-center justify-center gap-4 py-2">
                  <SocialIcons />
                </div>
              </nav>

              {/* Sticky bottom actions */}
              <div className="safe-bottom border-t border-border/60 bg-background/95 px-4 pt-3 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="lg" className="h-12 rounded-xl text-[15px]">
                    <Link to="/app" onClick={() => setOpen(false)}>{t("nav.signIn")}</Link>
                  </Button>
                  <Button asChild size="lg" className="h-12 rounded-xl bg-gradient-primary text-[15px] shadow-soft">
                    <Link to="/app" onClick={() => setOpen(false)}>{t("nav.openDashboard")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border/60 bg-parchment/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-6 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <img
              src={logoMark}
              alt="BeistandPlus"
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
              loading="lazy"
            />
            <div data-no-translate className="font-display text-xl font-semibold">
              Beistand<span className="text-success">Plus</span>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">{t("footer.tagline")}</p>
          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
              {t("footer.followUs")}
            </div>
            <div className="mt-3">
              <SocialIcons />
            </div>
          </div>
        </div>
        <FooterCol
          title={t("footer.colPlatform")}
          links={[
            [t("footer.howItWorks"), "/how-it-works"],
            [t("footer.services"), "/services"],
            [t("footer.bereavement"), "/bereavement"],
            [t("footer.pricing"), "/pricing"],
            [t("footer.blog"), "/blog"],
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
          ]}
        />
        <FooterCol
          title={t("footer.colLegal")}
          links={[
            [t("footer.terms"), "/legal/terms"],
            [t("footer.privacy"), "/legal/privacy"],
            [t("footer.cookies"), "/legal/cookies"],
            [t("footer.complaints"), "/legal/complaints"],
            [t("footer.impressum"), "/legal/impressum"],
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
