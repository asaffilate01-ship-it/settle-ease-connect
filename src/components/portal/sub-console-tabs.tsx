import { useNavigate, useSearch } from "@tanstack/react-router";

export type SubConsoleTab = "leads" | "quotes" | "callbacks" | "reconciliation";

const TABS: { id: SubConsoleTab; label: string }[] = [
  { id: "leads", label: "Leads" },
  { id: "quotes", label: "Quotes" },
  { id: "callbacks", label: "Callbacks" },
  { id: "reconciliation", label: "Reconciliation" },
];

export function useSubConsoleTab(): [SubConsoleTab, (t: SubConsoleTab) => void] {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tab?: string };
  const active = (TABS.find((t) => t.id === search.tab)?.id ?? "leads") as SubConsoleTab;
  const setTab = (t: SubConsoleTab) => {
    navigate({
      to: ".",
      search: ((prev: Record<string, unknown>) => ({
        ...prev,
        tab: t === "leads" ? undefined : t,
      })) as never,
      replace: true,
    });

  };
  return [active, setTab];
}

export function SubConsoleTabs({
  active,
  onChange,
}: {
  active: SubConsoleTab;
  onChange: (t: SubConsoleTab) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border/60 pb-0">
      {TABS.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              on
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyTab({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
