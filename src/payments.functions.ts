type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  metadata?: Record<string, string>;
};

/**
 * Provider-neutral email adapter. Point EMAIL_DELIVERY_ENDPOINT at a trusted
 * internal gateway/serverless function that accepts this JSON contract and
 * connects to the contracted email provider.
 */
export async function deliverTransactionalEmail(message: TransactionalEmail) {
  const endpoint = process.env.EMAIL_DELIVERY_ENDPOINT;
  const token = process.env.EMAIL_DELIVERY_BEARER_TOKEN;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!endpoint || !token || !from) throw new Error("Email delivery is not configured.");
  const parsed = new URL(endpoint);
  if (parsed.protocol !== "https:") throw new Error("Email delivery endpoint must use HTTPS.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(parsed, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ from, ...message }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Email gateway returned HTTP ${response.status}.`);
  } finally {
    clearTimeout(timer);
  }
}
