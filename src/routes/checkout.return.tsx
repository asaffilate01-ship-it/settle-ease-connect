import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({
    meta: [
      { title: "Checkout complete — BeistandPlus" },
      { name: "description", content: "Your BeistandPlus subscription is being activated." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
      <CheckCircle2 className="h-14 w-14 text-emerald-500" />
      <h1 className="font-display text-3xl font-semibold">Thank you — your plan is activating.</h1>
      <p className="text-muted-foreground">
        {session_id
          ? "Payment complete. Your subscription will appear in your dashboard within a few seconds."
          : "No checkout session was found in the URL."}
      </p>
      <div className="flex gap-3">
        <Link
          to="/app"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Go to my dashboard
        </Link>
        <Link to="/pricing" className="rounded-lg border px-4 py-2 text-sm font-semibold">
          Back to pricing
        </Link>
      </div>
    </div>
  );
}
