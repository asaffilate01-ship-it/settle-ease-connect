import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Dashboard — Beistand" },
      { name: "description", content: "Your Beistand dashboard: cases, checklists, benefits, documents, and providers." },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Link to="/" className="lg:hidden font-display text-lg font-semibold">Beistand</Link>
          <div className="hidden max-w-lg flex-1 items-center gap-2 rounded-lg border border-border/60 bg-parchment/60 px-3 py-1.5 md:flex">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search cases, documents, providers, benefits…"
            />
            <kbd className="rounded border border-border bg-background px-1.5 text-[10px] text-muted-foreground">⌘K</kbd>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2 py-1 text-sm">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold">AK</div>
              <div className="hidden md:block">
                <div className="text-xs leading-tight font-medium">Ahmed Khan</div>
                <div className="text-[10px] leading-tight text-muted-foreground">Family · Premium</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
