export const ADVISORY_MODEL = "google/gemini-2.5-flash";

export const ADVISORY_DOMAINS = [
  "legal",
  "tax",
  "immigration",
  "insurance",
  "benefits",
  "medical",
  "funeral",
  "general",
] as const;

export type AdvisoryDomain = (typeof ADVISORY_DOMAINS)[number];

const REGULATED: AdvisoryDomain[] = ["legal", "tax", "immigration", "insurance", "medical"];

export function advisorySystemPrompt(domain: AdvisoryDomain): string {
  const base = `You draft internal notes for BeistandPlus case handlers in Germany. You are NOT the adviser: everything you write is a draft that a qualified human reviews and approves before any client sees it. Be factual, cite the German statute or authority when relevant (e.g. AufenthG, SGB II, EStG, BGB), state clearly what information is missing, and never invent names, dates, amounts or references.`;
  if (REGULATED.includes(domain)) {
    return `${base}\n\nThis is a REGULATED domain (${domain}). Do not give advice or a recommendation. Produce: (1) factual background, (2) the process/authority involved, (3) questions the handler must clarify, (4) an explicit line stating that regulated advice must come from a licensed professional (Rechtsanwalt / Steuerberater / Versicherungsmakler / Arzt as applicable).`;
  }
  return `${base}\n\nDomain: ${domain}. Produce a short structured draft with headings and concrete next steps.`;
}

export async function callAdvisoryGateway(
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: ADVISORY_MODEL, messages }),
  });
  if (res.status === 429) throw new Error("AI service is rate-limited. Please try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please top up in workspace billing.");
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = json.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("AI returned an empty draft.");
  return text;
}
