import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Trash2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  listMyDirectoryListings,
  createDirectoryListing,
  updateDirectoryListing,
  deleteDirectoryListing,
} from "@/lib/directory.functions";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/directory/list-your-business")({
  head: () => ({
    meta: [
      { title: "List your business — BeistandPlus directory" },
      {
        name: "description",
        content:
          "Submit a business for moderation in the BeistandPlus community directory. Public information is shown only after approval.",
      },
      { property: "og:title", content: "List your business — BeistandPlus directory" },
      {
        property: "og:description",
        content:
          "Submit public business information for review in the BeistandPlus community directory.",
      },
      { property: "og:url", content: "https://beistandplus.de/directory/list-your-business" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/directory/list-your-business" }],
  }),
  component: ListYourBusiness,
});

type Listing = {
  id: string;
  business_name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  city: string | null;
  bundesland: string | null;
  languages: string[];
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  status: string;
  featured: boolean;
};

const myListingsQuery = queryOptions({
  queryKey: ["directory", "mine"],
  queryFn: () => listMyDirectoryListings(),
});

function ListYourBusiness() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
          Community directory
        </div>
        <h1 className="display-hero text-balance mt-3 font-semibold">
          Submit your business for directory review.
        </h1>
        <p className="mt-5 text-base text-muted-foreground">
          There is currently no listing fee. Every submission is moderated before publication, and
          approval, placement, traffic or enquiries are not guaranteed.
        </p>

        <div className="mt-8 rounded-3xl border border-border/60 bg-card p-6 shadow-card">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-semibold">€0</span>
            <span className="text-muted-foreground">/ forever</span>
          </div>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {[
              "Public listing name, category, city and languages",
              "Website shown only when it uses a safe public link",
              "Phone, email and street address kept out of the public directory view",
              "Changes return to the moderation queue",
              "Listings can be suspended or removed after review",
              "No current listing or per-lead fee",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {!session ? (
          <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Sign in or create a free account to submit your listing.
            </p>
            <Button asChild size="lg" className="mt-4 bg-gradient-primary">
              <Link to="/auth">Sign in to continue</Link>
            </Button>
          </div>
        ) : (
          <MyListingsSection />
        )}

        <div className="mt-8 flex items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-sm">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-clay-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <strong className="text-foreground">What happens after submission?</strong>{" "}
            <span className="text-muted-foreground">
              The listing remains pending while BeistandPlus checks the submitted information.
              Publication is not an endorsement, licence verification or recommendation; customers
              must confirm suitability and credentials directly.
            </span>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function MyListingsSection() {
  const { data = [], isLoading } = useQuery(myListingsQuery);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Your listings</h2>
        {!creating && !editing && (
          <Button className="bg-gradient-primary" onClick={() => setCreating(true)}>
            Add listing
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : creating || editing ? (
        <ListingForm
          initial={editing ?? undefined}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
          You don't have any listings yet.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((l) => (
            <ListingRow key={l.id} listing={l as Listing} onEdit={() => setEditing(l as Listing)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingRow({ listing, onEdit }: { listing: Listing; onEdit: () => void }) {
  const qc = useQueryClient();
  const delFn = useServerFn(deleteDirectoryListing);
  const del = useMutation({
    mutationFn: () => delFn({ data: { id: listing.id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["directory", "mine"] });
      toast.success("Listing removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium truncate">{listing.business_name}</div>
          <Badge variant="outline" className="capitalize">
            {listing.status}
          </Badge>
          {listing.featured && (
            <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/40">Featured</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {listing.category}
          {listing.subcategory ? ` · ${listing.subcategory}` : ""} · {listing.city ?? "—"}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => confirm("Delete this listing?") && del.mutate()}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

const CATEGORIES = [
  "Legal",
  "Medical",
  "Tax",
  "Insurance",
  "Translation",
  "Travel",
  "Trades",
  "Education",
  "Faith",
  "Funeral",
  "Food",
  "Beauty",
  "Other",
];

function ListingForm({ initial, onDone }: { initial?: Listing; onDone: () => void }) {
  const qc = useQueryClient();
  const createFn = useServerFn(createDirectoryListing);
  const updateFn = useServerFn(updateDirectoryListing);
  const [form, setForm] = useState({
    business_name: initial?.business_name ?? "",
    category: initial?.category ?? "Legal",
    subcategory: initial?.subcategory ?? "",
    description: initial?.description ?? "",
    city: initial?.city ?? "",
    bundesland: initial?.bundesland ?? "",
    languages: (initial?.languages ?? []).join(", "),
    website: initial?.website ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
  });

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        business_name: form.business_name,
        category: form.category,
        subcategory: form.subcategory || null,
        description: form.description || null,
        city: form.city || null,
        bundesland: form.bundesland || null,
        languages: form.languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        website: form.website || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
      };
      if (initial) await updateFn({ data: { id: initial.id, ...payload } });
      else await createFn({ data: payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["directory", "mine"] });
      toast.success(initial ? "Listing updated" : "Listing published");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
      className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name *">
          <Input
            required
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
          />
        </Field>
        <Field label="Category *">
          <select
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Subcategory">
          <Input
            value={form.subcategory}
            onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
            placeholder="e.g. Immigration lawyer"
          />
        </Field>
        <Field label="Languages (comma-separated)">
          <Input
            value={form.languages}
            onChange={(e) => setForm({ ...form, languages: e.target.value })}
            placeholder="DE, EN, TR"
          />
        </Field>
        <Field label="City">
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </Field>
        <Field label="Bundesland">
          <Input
            value={form.bundesland}
            onChange={(e) => setForm({ ...form, bundesland: e.target.value })}
          />
        </Field>
        <Field label="Website">
          <Input
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://"
          />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Street address">
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Description">
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="min-h-24"
          placeholder="What do you offer, and to whom?"
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" className="bg-gradient-primary" disabled={mut.isPending}>
          {mut.isPending ? "Saving…" : initial ? "Save changes" : "Publish listing"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
