import { useDeferredValue, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { searchWorkspace } from "@/lib/search.functions";

const CLIENT_LINKS = [
  { label: "Overview", to: "/app", icon: LayoutDashboard },
  { label: "Cases", to: "/app/cases", icon: BriefcaseBusiness },
  { label: "Documents", to: "/app/documents", icon: FileText },
  { label: "Messages", to: "/app/messages", icon: MessageSquare },
  { label: "Settings", to: "/app/settings", icon: Settings },
];
const STAFF_LINKS = [
  { label: "Portal overview", to: "/portal", icon: LayoutDashboard },
  { label: "My desk", to: "/portal/my-desk", icon: BriefcaseBusiness },
  { label: "CRM", to: "/portal/crm", icon: UserRound },
  { label: "Enquiries", to: "/portal/enquiries", icon: MessageSquare },
  { label: "Knowledge", to: "/portal/knowledge", icon: BookOpen },
  { label: "Settings", to: "/app/settings", icon: Settings },
];

const RESULT_ICON = {
  case: BriefcaseBusiness,
  provider: Building2,
  knowledge: BookOpen,
  contact: UserRound,
  lead: UserRound,
};

export function GlobalCommandSearch({ mode }: { mode: "client" | "staff" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const search = useServerFn(searchWorkspace);
  const navigate = useNavigate();
  const resultsQ = useQuery({
    queryKey: ["workspace-search", deferredQuery],
    queryFn: () => search({ data: { query: deferredQuery } }),
    enabled: deferredQuery.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(to: string) {
    setOpen(false);
    setQuery("");
    navigate({ to: to as "/app" });
  }

  const quickLinks = mode === "staff" ? STAFF_LINKS : CLIENT_LINKS;
  const results = resultsQ.data ?? [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden max-w-lg flex-1 items-center gap-2 rounded-lg border border-border/60 bg-parchment/60 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground md:flex"
        aria-label="Search workspace"
        aria-haspopup="dialog"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 truncate">
          {mode === "staff" ? "Search cases, contacts and knowledge…" : "Search your workspace…"}
        </span>
        <kbd className="rounded border border-border bg-background px-1.5 text-[10px]">⌘K</kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 text-muted-foreground md:hidden"
        aria-label="Search workspace"
      >
        <Search className="h-4 w-4" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Type a name, reference or service…"
        />
        <CommandList>
          <CommandEmpty>
            {resultsQ.isFetching ? "Searching…" : "No accessible results found."}
          </CommandEmpty>
          {query.trim().length < 2 && (
            <CommandGroup heading="Quick navigation">
              {quickLinks.map((item) => (
                <CommandItem key={item.to} value={item.label} onSelect={() => go(item.to)}>
                  <item.icon />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.length > 0 && (
            <CommandGroup heading="Accessible results">
              {results.map((result) => {
                const Icon = RESULT_ICON[result.kind];
                return (
                  <CommandItem
                    key={result.id}
                    value={`${result.title} ${result.subtitle}`}
                    onSelect={() => go(result.to)}
                  >
                    <Icon />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{result.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    </span>
                    <CommandShortcut className="capitalize">{result.kind}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
