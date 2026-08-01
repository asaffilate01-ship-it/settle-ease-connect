import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const FAMILY_DESTINATIONS = [
  ["Overview", "/app"],
  ["AI guidance", "/app/assistant"],
  ["Cases", "/app/cases"],
  ["Secure vault", "/app/documents"],
  ["Benefits", "/app/benefits"],
  ["Messages", "/app/messages"],
  ["Providers", "/app/providers"],
  ["Account and billing", "/app/account"],
  ["Settings", "/app/settings"],
] as const;

const STAFF_DESTINATIONS = [
  ["Operations overview", "/portal"],
  ["My desk", "/portal/my-desk"],
  ["CRM", "/portal/crm"],
  ["Case operations", "/portal/operations"],
  ["Experts", "/portal/experts"],
  ["Partners", "/portal/partners"],
  ["Insurance", "/portal/insurance"],
  ["Tax", "/portal/tax"],
  ["Benefits", "/portal/benefits"],
  ["Knowledge base", "/portal/knowledge"],
  ["Analytics", "/portal/analytics"],
  ["Audit", "/portal/audit"],
] as const;

export function HeaderCommandSearch({ variant }: { variant: "family" | "staff" }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const destinations = variant === "staff" ? STAFF_DESTINATIONS : FAMILY_DESTINATIONS;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function choose(path: string) {
    setOpen(false);
    void navigate({ to: path as "/app" });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden max-w-lg flex-1 items-center gap-2 rounded-lg border border-border/60 bg-parchment/60 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-parchment md:flex"
        aria-label="Search navigation"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1">Find a page or tool…</span>
        <kbd className="rounded border border-border bg-background px-1.5 text-[10px]">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a page or tool name…" />
        <CommandList>
          <CommandEmpty>No matching page found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {destinations.map(([label, path]) => (
              <CommandItem key={path} value={`${label} ${path}`} onSelect={() => choose(path)}>
                <Search className="h-4 w-4 text-muted-foreground" />
                <span>{label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{path}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
