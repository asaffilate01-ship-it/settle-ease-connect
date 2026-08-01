import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type MobilePortalNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export function MobilePortalNav({
  title,
  items,
}: {
  title: string;
  items: MobilePortalNavItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label={`Open ${title} navigation`}>
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(88vw,20rem)] p-0">
        <SheetHeader className="border-b border-border/60 px-5 py-5 text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Choose an area of your workspace.</SheetDescription>
        </SheetHeader>
        <nav className="space-y-1 overflow-y-auto p-3" aria-label={`${title} sections`}>
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/app"}
              onClick={() => setOpen(false)}
              activeProps={{ className: "bg-primary/10 text-primary" }}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
