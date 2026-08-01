import { Link } from "@tanstack/react-router";
import { Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/app-sidebar";

/**
 * Mobile navigation for the staff portal — reuses the role-aware AppSidebar
 * inside a slide-over sheet so staff keep full navigation below `lg`.
 */
export function PortalMobileNav() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("nav.menu", "Menu")}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-80 p-0">
        <SheetTitle className="sr-only">{t("nav.menu", "Menu")}</SheetTitle>
        <div className="h-full" onClick={() => setOpen(false)}>
          <AppSidebar variant="mobile" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export type MobileNavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

/**
 * Mobile navigation for the expert and agent portals, which use their own
 * compact nav lists rather than the shared AppSidebar.
 */
export function MobileNavMenu({
  title,
  items,
  email,
  name,
  onSignOut,
}: {
  title: string;
  items: MobileNavItem[];
  email?: string | null;
  name?: string | null;
  onSignOut: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("nav.menu", "Menu")}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[82vw] max-w-72 bg-sidebar p-0 text-sidebar-foreground">
        <SheetTitle className="border-b border-sidebar-border px-5 py-4 font-display text-lg font-semibold">
          {title}
        </SheetTitle>
        <nav className="space-y-1 p-3">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/expert"}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: item.exact ?? false }}
              activeProps={{ className: "bg-sidebar-accent text-sidebar-primary" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          {(name || email) && (
            <div className="mb-3 rounded-xl bg-sidebar-accent/60 p-3 text-sm">
              {name && <div className="truncate font-medium">{name}</div>}
              {email && <div className="truncate text-xs text-sidebar-foreground/70">{email}</div>}
            </div>
          )}
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-2 rounded-lg bg-sidebar-primary/10 px-3 py-2 text-sm font-semibold text-sidebar-primary"
          >
            <LogOut className="h-4 w-4" /> {t("sidebar.signOut", { defaultValue: "Sign out" })}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
