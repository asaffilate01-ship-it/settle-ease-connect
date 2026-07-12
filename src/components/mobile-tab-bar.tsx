import { Link, useRouterState } from "@tanstack/react-router";
import { Home, FolderOpen, MessagesSquare, Bell, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Native-style bottom tab bar for the authenticated `/app` shell on mobile.
 * Follows iOS/Android platform conventions:
 *  - 5 tabs, icon + short label
 *  - fixed at the bottom, respects safe-area
 *  - active tab uses primary color and subtle indicator dot
 *  - the "More" tab opens the full sidebar Sheet
 */
export function MobileTabBar() {
  const { t } = useTranslation();
  const { setOpenMobile } = useSidebar();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const tabs: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
    { to: "/app", label: t("sidebar.overview", "Home"), icon: Home, exact: true },
    { to: "/app/cases", label: t("sidebar.cases", "Cases"), icon: FolderOpen },
    { to: "/app/messages", label: t("sidebar.messages", "Messages"), icon: MessagesSquare },
    { to: "/app/notifications", label: t("sidebar.notifications", "Alerts"), icon: Bell },
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-2xl md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map((tab) => {
          const active = isActive(tab.to, tab.exact);
          const Icon = tab.icon;
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                className="relative flex flex-col items-center gap-1 px-2 pt-2.5 pb-2 text-[11px] font-medium transition active:scale-95"
              >
                <span
                  className={
                    active
                      ? "grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary transition"
                      : "grid h-9 w-9 place-items-center rounded-2xl text-muted-foreground transition"
                  }
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={
                    active ? "truncate text-primary" : "truncate text-muted-foreground"
                  }
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => setOpenMobile(true)}
            className="flex w-full flex-col items-center gap-1 px-2 pt-2.5 pb-2 text-[11px] font-medium text-muted-foreground transition active:scale-95"
            aria-label={t("nav.menu", "Menu")}
          >
            <span className="grid h-9 w-9 place-items-center rounded-2xl text-muted-foreground">
              <Menu className="h-5 w-5" />
            </span>
            <span className="truncate">{t("nav.more", "More")}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
