import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChevronDown, ChevronRight, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SocialIcons } from "@/components/social-icons";
import { useCurrentUser } from "@/hooks/use-current-user";
import { primaryRole, landingForRoles } from "@/lib/role-landing";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import logoMark from "@/assets/brand/logo-mark.png";
import { MobileCtaBar } from "@/components/mobile-cta-bar";

type NavChild = { label: string; href: string; hint?: string };
type NavGroup = { label: string; href?: string; children?: NavChild[] };

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, roles, loading } = useCurrentUser();
  const isSignedIn = !!user && !loading;
  const dashHref = isSignedIn ? landingForRoles(roles) : "/app";
  const role = primaryRole(roles);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/", replace: true });
  }


  // Grouped desktop nav — collapses 8 links into 5 top-level slots.
  const groups: NavGroup[] = [
    {
      label: t("nav.services", "Services"),
      children: [
        {
          label: t("nav.services", "Services"),
          href: "/services",
          hint: t("nav.hint.services", "All settlement & welfare services"),
        },
        {
          label: t("nav.directory", "Directory"),
          href: "/directory",
          hint: t("nav.hint.directory", "Find vetted local providers"),
        },
        {
          label: t("nav.bereavement", "Bereavement"),
          href: "/bereavement",
          hint: t("nav.hint.bereavement", "End-of-life support & cover"),
        },
        {
          label: t("nav.students", "Students"),
          href: "/students",
          hint: t("nav.hint.students", "For international students"),
        },
        {
          label: "Insurance",
          href: "/insurance",
          hint: "Broker-placed cover in 13 languages",
        },
        {
          label: "Group cover",
          href: "/group-cover",
          hint: "€20k Sterbegeld for associations & employers",
        },
        {
          label: "Tax refund",
          href: "/tax",
          hint: "Steuererklärung, guided in your language",
        },
      ],
    },
    { label: t("nav.howItWorks", "How it works"), href: "/how-it-works" },
    { label: t("nav.forProviders", "For providers"), href: "/for-providers" },
    { label: t("nav.pricing", "Pricing"), href: "/pricing" },
    { label: t("nav.blog", "Blog"), href: "/blog" },
  ];

  // Flat list for the mobile sheet.
  const mobileLinks: [string, string][] = [
    [t("nav.howItWorks"), "/how-it-works"],
    [t("nav.services"), "/services"],
    [t("nav.directory"), "/directory"],
      [t("nav.bereavement"), "/bereavement"],
      [t("nav.students", "Students"), "/students"],
      ["Insurance", "/insurance"],
      ["Group cover", "/group-cover"],
      [t("nav.forProviders"), "/for-providers"],
      [t("nav.pricing"), "/pricing"],
      [t("nav.blog"), "/blog"],
    ];

  return (
    <>
    <div className="safe-top sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 md:h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img
              src={logoMark}
              alt="BeistandPlus"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div
              data-no-translate
              className="truncate font-display text-xl font-semibold tracking-tight text-ink md:text-[22px]"
            >
              Beistand<span className="text-terracotta">Plus</span>
            </div>
          </Link>

          {/* Grouped nav (desktop) */}
          <nav className="hidden items-center gap-1 md:flex">
            {groups.map((g) =>
              g.children ? (
                <DesktopDropdown key={g.label} label={g.label} items={g.children} />
              ) : (
                <Link
                  key={g.label}
                  to={g.href!}
                  className="rounded-md px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/70 transition-colors hover:text-terracotta"
                  activeProps={{ className: "text-terracotta" }}
                >
                  {g.label}
                </Link>
              ),
            )}
          </nav>

          {/* Utility cluster (desktop) */}
          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />
            <div className="h-5 w-px bg-border" />
            {isSignedIn ? (
              <>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/70 transition-colors hover:text-terracotta"
                >
                  <LogOut className="h-4 w-4" />
                  {t("sidebar.signOut", { defaultValue: "Sign out" })}
                </button>
                <Button
                  asChild
                  size="sm"
                  className="h-9 rounded-none border border-ink bg-ink px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-parchment shadow-none transition-colors hover:bg-terracotta hover:border-terracotta"
                >
                  <Link to={dashHref}>
                    {role === "agent"
                      ? t("nav.openAgentPortal", { defaultValue: "Agent portal" })
                      : dashHref === "/portal"
                      ? t("nav.openStaffPortal", { defaultValue: "Staff portal" })
                      : t("nav.openDashboard")}
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/70 transition-colors hover:text-terracotta"
                >
                  {t("nav.signIn")}
                </Link>
                <Button
                  asChild
                  size="sm"
                  className="h-9 rounded-none border border-ink bg-ink px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-parchment shadow-none transition-colors hover:bg-terracotta hover:border-terracotta"
                >
                  <Link to="/auth">{t("nav.openDashboard")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-none border border-ink bg-ink px-3 text-parchment shadow-sm transition active:scale-95 md:hidden"
                aria-label={t("nav.menu")}
              >
                <Menu className="h-5 w-5" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {t("nav.menu", "Menu")}
                </span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="safe-top w-full max-w-full border-0 bg-background/95 p-0 backdrop-blur-2xl sm:max-w-sm [&>button.absolute]:hidden"
            >
              <div className="flex h-full flex-col">
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

                <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
                  <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-card/70">
                    {mobileLinks.map(([label, href]) => (
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

                <div className="safe-bottom border-t border-border/60 bg-background/95 px-4 pt-3 pb-4">
                  {isSignedIn ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="lg" className="h-12 rounded-xl text-[15px]" onClick={handleSignOut}>
                        <LogOut className="me-2 h-4 w-4" />
                        {t("sidebar.signOut", { defaultValue: "Sign out" })}
                      </Button>
                      <Button asChild size="lg" className="h-12 rounded-xl bg-gradient-primary text-[15px] shadow-soft">
                        <Link to={dashHref} onClick={() => setOpen(false)}>{t("nav.openDashboard")}</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" size="lg" className="h-12 rounded-xl text-[15px]">
                        <Link to="/auth" onClick={() => setOpen(false)}>{t("nav.signIn")}</Link>
                      </Button>
                      <Button asChild size="lg" className="h-12 rounded-xl bg-gradient-primary text-[15px] shadow-soft">
                        <Link to="/auth" onClick={() => setOpen(false)}>{t("nav.openDashboard")}</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
      </div>
    </div>
    <MobileCtaBar hidden={isSignedIn} />
    </>
  );
}

function DesktopDropdown({ label, items }: { label: string; items: NavChild[] }) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded-md px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/70 transition-colors hover:text-terracotta focus-visible:text-terracotta focus-visible:outline-none"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-200 group-hover:rotate-180" />
      </button>
      <div
        className="invisible absolute start-0 top-full z-50 mt-1 w-80 origin-top translate-y-1 border border-border/70 bg-background p-2 opacity-0 shadow-elevated transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
        role="menu"
      >
        <div className="mb-1 border-b border-border/60 px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-terracotta">
          {label}
        </div>
        {items.map((it) => (
          <Link
            key={it.href + it.label}
            to={it.href}
            role="menuitem"
            className="block rounded-sm px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-parchment/70 hover:text-terracotta focus-visible:bg-parchment/70 focus-visible:outline-none"
          >
            <div className="font-display text-[15px] font-semibold leading-tight">{it.label}</div>
            {it.hint && <div className="mt-0.5 text-xs text-muted-foreground">{it.hint}</div>}
          </Link>
        ))}
      </div>
    </div>
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
            ["Group cover", "/group-cover"],
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
            ["Trust & compliance", "/trust"],
            ["Partners", "/partners"],
            ["Institutional partnerships", "/partnerships"],

            ["Offline mode", "/offline"],
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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <div>{t("footer.copyright", { year: new Date().getFullYear() })}</div>
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
