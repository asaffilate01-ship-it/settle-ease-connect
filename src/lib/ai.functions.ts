import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callGateway(messages: Array<{ role: string; content: string }>, jsonMode = false) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (res.status === 429) throw new Error("AI service is rate-limited. Please try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please top up in workspace billing.");
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

/** Summarise a case document. Text is provided by caller (already extracted). */
export const summariseCaseDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    caseId: z.string().uuid().optional(),
    documentId: z.string().uuid().optional(),
    filename: z.string().min(1).max(200),
    text: z.string().min(20).max(60000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const prompt = `Summarise this German settlement / welfare document for a case manager. Return concise Markdown with: **Type of document**, **Key facts** (bullet list of names, dates, amounts, references), **Actions the client may need to take**, and **Deadlines** if any. Filename: ${data.filename}\n\n---\n${data.text}`;
    const summary = await callGateway([
      { role: "system", content: "You help German case managers triage client paperwork. Be factual, brief, and never invent details." },
      { role: "user", content: prompt },
    ]);
    await context.supabase.from("ai_document_analyses").insert({
      case_id: data.caseId ?? null,
      vault_document_id: data.documentId ?? null,
      owner_user_id: context.userId,
      kind: "summary",
      input_excerpt: data.text.slice(0, 500),
      output_text: summary,
      model: MODEL,
    });
    return { summary };
  });

/** Extract likely eligibility signals for benefits from an uploaded document text. */
export const extractEligibilityFromDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    filename: z.string().min(1).max(200),
    text: z.string().min(20).max(60000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const raw = await callGateway([
      { role: "system", content: "You extract structured facts from German welfare/employment/tax documents. Never guess — if a field is not present, use null." },
      { role: "user", content: `Return strict JSON with keys: household_size (int|null), monthly_net_income_eur (number|null), monthly_rent_eur (number|null), employment_status (string|null), children_under_18 (int|null), disability_grade (int|null), residence_status (string|null), notes (string|null). Filename: ${data.filename}\n\nDocument:\n${data.text}` },
    ], true);
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { notes: raw }; }
    await context.supabase.from("ai_document_analyses").insert({
      owner_user_id: context.userId,
      kind: "eligibility_extract",
      input_excerpt: data.text.slice(0, 500),
      output_json: parsed,
      model: MODEL,
    });
    return { fields: parsed };
  });

/** Staff-only internal knowledge base assistant. Streams a plain answer. */
export const askKnowledgeBase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    question: z.string().min(3).max(2000),
    history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(20).default([]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // Ensure caller is internal
    const { data: internal } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
    if (!internal) throw new Error("Staff only.");

    // Pull top knowledge services as context
    const { data: services } = await context.supabase
      .from("knowledge_services")
      .select("name, slug, short_description, typical_timeline, official_fees, category:knowledge_categories(name)")
      .eq("status", "active")
      .limit(60);
    const kbContext = (services ?? []).map((s: any) => `• ${s.name} (${s.slug}) — ${s.short_description ?? ""} · timeline: ${s.typical_timeline ?? "?"} · fees: ${s.official_fees ?? "?"}`).join("\n");

    const answer = await callGateway([
      { role: "system", content: `You are the internal BeistandPlus staff knowledge assistant. Answer factually about German welfare, benefits, immigration, tax, funeral, and settlement processes. Cite service slugs when relevant. If the internal KB does not cover it, say so.\n\nInternal KB summary:\n${kbContext}` },
      ...data.history,
      { role: "user", content: data.question },
    ]);
    await context.supabase.from("ai_document_analyses").insert({
      owner_user_id: context.userId,
      kind: "kb_answer",
      input_excerpt: data.question.slice(0, 500),
      output_text: answer,
      model: MODEL,
    });
    return { answer };
  });
