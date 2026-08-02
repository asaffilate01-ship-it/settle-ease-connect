import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const Input = z.object({
  question: z.string().trim().min(2).max(2000),
  language: z.string().max(8).default("en"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      }),
    )
    .max(12)
    .default([]),
});

/** Authenticated family guidance assistant, grounded in the internal service KB. */
export const askFamilyAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");

    const { data: services } = await context.supabase
      .from("knowledge_services")
      .select("name, slug, short_description, typical_timeline, official_fees")
      .eq("status", "active")
      .limit(40);

    const kb = (services ?? [])
      .map(
        (s) =>
          `• ${s.name} (${s.slug}) — ${s.short_description ?? ""}; timeline: ${s.typical_timeline ?? "unknown"}; official fees: ${s.official_fees ?? "check official source"}`,
      )
      .join("\n");

    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are the BeistandPlus family guidance assistant for life in Germany. " +
              `Reply in the member's language (code: ${data.language}). ` +
              "Give short, practical steps, list the documents needed, name the responsible authority, and flag deadlines. " +
              "Never claim to be a lawyer, tax adviser, doctor or insurance broker, and never invent fees, offices or eligibility. " +
              "When something is uncertain, tell the member to confirm with the authority or their case manager.\n\n" +
              `Internal service summaries:\n${kb}`,
          },
          ...data.history,
          { role: "user", content: data.question },
        ],
      }),
    });

    if (res.status === 429)
      throw new Error("The assistant is busy right now — please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Please contact support.");
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Assistant error ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const answer = json.choices?.[0]?.message?.content?.trim() ?? "";

    await context.supabase.from("ai_document_analyses").insert({
      owner_user_id: context.userId,
      kind: "family_assistant",
      input_excerpt: data.question.slice(0, 500),
      output_text: answer,
      model: MODEL,
    });

    return { answer };
  });
