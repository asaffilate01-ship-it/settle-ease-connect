/**
 * Transactional email adapter — see OPERATIONAL_RELEASE.md §2.
 *
 * Server-only. Posts to an authenticated HTTPS relay endpoint. When the
 * endpoint is not configured the caller receives `configured: false` so the
 * product can queue the message instead of pretending it was delivered.
 */
export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  metadata?: Record<string, unknown>;
};

export type EmailDeliveryResult =
  | { status: "sent" }
  | { status: "not_configured" }
  | { status: "failed"; error: string };

export async function sendTransactionalEmail(email: OutboundEmail): Promise<EmailDeliveryResult> {
  const endpoint = process.env["EMAIL_DELIVERY_ENDPOINT"];
  const token = process.env["EMAIL_DELIVERY_BEARER_TOKEN"];
  const from = process.env["CONTACT_FROM_EMAIL"];
  if (!endpoint || !token || !from) return { status: "not_configured" };
  if (!endpoint.startsWith("https://")) return { status: "failed", error: "Endpoint must be HTTPS" };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        from,
        to: email.to,
        subject: email.subject,
        text: email.text,
        replyTo: email.replyTo ?? process.env["CONTACT_TEAM_EMAIL"] ?? from,
        metadata: email.metadata ?? {},
      }),
      redirect: "error",
    });
    if (!response.ok) return { status: "failed", error: `Relay returned HTTP ${response.status}` };
    return { status: "sent" };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : "Delivery failed" };
  }
}
