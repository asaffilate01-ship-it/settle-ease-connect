import { useCallback, useState } from "react";
import { StripeEmbeddedCheckoutInline } from "@/components/StripeEmbeddedCheckout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type CheckoutOptions = { priceId: string; returnUrl?: string; title?: string };

export function useStripeCheckout() {
  const [opts, setOpts] = useState<CheckoutOptions | null>(null);

  const openCheckout = useCallback((o: CheckoutOptions) => setOpts(o), []);
  const closeCheckout = useCallback(() => setOpts(null), []);

  const checkoutElement = (
    <Dialog open={!!opts} onOpenChange={(o) => !o && closeCheckout()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{opts?.title ?? "Complete your subscription"}</DialogTitle>
        </DialogHeader>
        {opts && <StripeEmbeddedCheckoutInline priceId={opts.priceId} returnUrl={opts.returnUrl} />}
      </DialogContent>
    </Dialog>
  );

  return { openCheckout, closeCheckout, isOpen: !!opts, checkoutElement };
}
