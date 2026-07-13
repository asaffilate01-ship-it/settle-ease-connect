import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  targetLang: z.string().min(2).max(8),
  targetName: z.string().min(2).max(40),
  texts: z.array(z.string().min(1).max(2000)).min(1).max(80),
});

/**
 * Batch-translate short UI strings via the Lovable AI Gateway.
 *
 * Returns an array of translated strings the same length as `texts`
 * (matched by index). The server fn is intentionally stateless — the
 * client is responsible for caching results in localStorage.
 */
export const translateBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
      "Translate each item into " + data.targetName + " (code: " + data.targetLang + "). " +
      "Rules: (1) Keep meaning, tone and length close to the source — this is UI copy. " +
      "(2) Preserve placeholders like {{name}}, {count}, %s, <b>...</b>, URLs and emails EXACTLY. " +
      "(3) Never translate the brand name 'BeistandPlus', 'BeistandPlus' or product names. " +
      "(4) Return ONLY a JSON object of the form {\"t\":[\"...\", \"...\"]} with the same number of items in the same order. " +
      "(5) No commentary, no markdown fences.";

    const user = JSON.stringify({ items: data.texts });

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
          temperature: 0.2,
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`[translate] gateway ${res.status}: ${body}`);
      // Graceful degradation — return the originals.
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
    const translations = data.texts.map((src, i) => {
      const v = arr[i];
      return typeof v === "string" && v.trim().length > 0 ? v : src;
    });
    return { translations };
  });
