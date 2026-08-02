import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/lib/payments.functions";
import { isNative, nativePlatform } from "@/lib/native";

interface StripeEmbeddedCheckoutProps {
  priceId: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckoutInline({ priceId, returnUrl }: StripeEmbeddedCheckoutProps) {
  if (isNative()) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center">
        <h2 className="font-semibold">Purchases are not available in the mobile app</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You can use an existing BeistandPlus membership here. Mobile plan purchases will be
          enabled after App Store and Google Play billing approval.
        </p>
      </div>
    );
  }

  const fetchClientSecret = async (): Promise<string> => {
    const result = await createCheckoutSession({
      data: {
        priceId,
        returnUrl:
          returnUrl ?? `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
        clientPlatform: nativePlatform(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
    return result.clientSecret;
  };

  return (
    <div id="checkout" className="min-h-[520px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
