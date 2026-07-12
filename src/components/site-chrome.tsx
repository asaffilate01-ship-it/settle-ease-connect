import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
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
              Deutschland
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/how-it-works" className="text-sm text-foreground/80 hover:text-foreground">How it works</Link>
          <Link to="/services" className="text-sm text-foreground/80 hover:text-foreground">Services</Link>
          <Link to="/bereavement" className="text-sm text-foreground/80 hover:text-foreground">Bereavement</Link>
          <Link to="/for-providers" className="text-sm text-foreground/80 hover:text-foreground">For providers</Link>
          <Link to="/pricing" className="text-sm text-foreground/80 hover:text-foreground">Pricing</Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/app">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-primary shadow-soft">
            <Link to="/app">Open dashboard</Link>
          </Button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="flex flex-col gap-1 p-4">
            <Link to="/how-it-works" className="rounded-md px-3 py-2 text-sm hover:bg-muted">How it works</Link>
            <Link to="/services" className="rounded-md px-3 py-2 text-sm hover:bg-muted">Services</Link>
            <Link to="/bereavement" className="rounded-md px-3 py-2 text-sm hover:bg-muted">Bereavement</Link>
            <Link to="/for-providers" className="rounded-md px-3 py-2 text-sm hover:bg-muted">For providers</Link>
            <Link to="/pricing" className="rounded-md px-3 py-2 text-sm hover:bg-muted">Pricing</Link>
            <Button asChild className="mt-2 bg-gradient-primary">
              <Link to="/app">Open dashboard</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
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
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Für jeden Weg in Deutschland. Settlement, welfare, benefits, and
            end-of-life care — one calm platform for families and the
            organisations that stand with them.
          </p>
        </div>
        <FooterCol
          title="Platform"
          links={[
            ["How it works", "/how-it-works"],
            ["Services", "/services"],
            ["Bereavement", "/bereavement"],
            ["Pricing", "/pricing"],
          ]}
        />
        <FooterCol
          title="For providers"
          links={[
            ["Funeral directors", "/for-providers"],
            ["Mosques & imams", "/for-providers"],
            ["Churches", "/for-providers"],
            ["Temples & Gurdwaras", "/for-providers"],
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            ["Contact", "/contact"],
            ["Impressum", "/contact"],
            ["Datenschutz", "/contact"],
          ]}
        />
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>© {new Date().getFullYear()} Beistand GmbH · Berlin</div>
          <div>Mit Sorgfalt gebaut · Made with care</div>
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
          <li key={label}>
            <Link to={href} className="text-muted-foreground hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
