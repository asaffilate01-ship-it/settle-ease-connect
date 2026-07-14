import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  targetLang: z.string().min(2).max(8),
  targetName: z.string().min(2).max(40),
  texts: z.array(z.string().min(1).max(2000)).min(1).max(80),
});

/**
 * Batch-translate short UI strings via the Lovable AI Gateway.
 *
 * Public by design — the site is translated for signed-out visitors too,
 * so this endpoint MUST NOT require a Supabase bearer token. Input is
 * strictly validated (max 80 short strings) and the handler only forwards
 * to the Lovable AI Gateway using a server-side key.
 */
export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    // English is a passthrough — no round-trip needed.
    if (data.targetLang === "en") {
      return { translations: data.texts };
    }

    const sys =
      "You are a professional UI translator for BeistandPlus, a German welfare & settlement platform. " +
      "You will receive a JSON array of items, each with an integer `i` (id) and a string `s` (source text). " +
      "Translate each `s` into " + data.targetName + " (code: " + data.targetLang + "). " +
      "Rules: (1) Keep meaning, tone and length close to the source — this is UI copy; do NOT merge, split, or reorder items. " +
      "(2) Preserve placeholders like {{name}}, {count}, %s, <b>...</b>, URLs and emails EXACTLY. " +
      "(3) Never translate the brand name 'BeistandPlus' or product names. " +
      "(4) If an item is already in " + data.targetName + ", return it unchanged. " +
      "(5) Return ONLY a JSON object of the form {\"t\":[{\"i\":0,\"v\":\"...\"}, ...]} with EXACTLY one entry per input `i`, same ids, same count. " +
      "(6) No commentary, no markdown fences.";

    const items = data.texts.map((s, i) => ({ i, s }));
    const user = JSON.stringify({ items });

    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`[translate] gateway ${res.status}: ${body}`);
      return { translations: data.texts };
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { t?: unknown } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { translations: data.texts };
    }
    const arr = Array.isArray(parsed.t) ? (parsed.t as unknown[]) : [];
    // Build id -> value map so out-of-order or missing ids can't cross-wire items.
    const byId = new Map<number, string>();
    for (const entry of arr) {
      if (entry && typeof entry === "object") {
        const e = entry as { i?: unknown; v?: unknown };
        if (typeof e.i === "number" && typeof e.v === "string" && e.v.trim().length > 0) {
          byId.set(e.i, e.v);
        }
      }
    }
    const translations = data.texts.map((src, i) => {
      const v = byId.get(i);
      if (!v) return src;
      // Sanity guard against occasional model misalignment: reject wildly longer output.
      if (src.length >= 3 && v.length > Math.max(60, src.length * 6)) return src;
      return v;
    });
    return { translations };
  });
