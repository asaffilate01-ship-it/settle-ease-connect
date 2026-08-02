import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enforcePublicRateLimit } from "@/lib/public-rate-limit.server";

const InputSchema = z.object({
  targetLang: z.string().min(2).max(8),
  targetName: z.string().min(2).max(40),
  texts: z.array(z.string().min(1).max(1000)).min(1).max(30),
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
  .validator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    await enforcePublicRateLimit({
      scope: "public-translation",
      limit: 10,
      windowSeconds: 3600,
      subject: data.targetLang,
    });
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    // English is a passthrough — no round-trip needed.
    if (data.targetLang === "en") {
      return { translations: data.texts };
    }

    // Server-side dedupe cache to cap paid AI usage: any string we've ever
    // translated to this target language is served from the DB, not the
    // gateway. Repeated calls with the same UI strings cost nothing.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const enc = new TextEncoder();
    async function sha256Hex(s: string): Promise<string> {
      const buf = await crypto.subtle.digest("SHA-256", enc.encode(s));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
    const hashes = await Promise.all(data.texts.map((t) => sha256Hex(t)));
    const { data: cached } = await supabaseAdmin
      .from("translation_cache")
      .select("source_hash, translated_text")
      .eq("target_lang", data.targetLang)
      .in("source_hash", hashes);
    const cacheMap = new Map<string, string>(
      (cached ?? []).map((r: any) => [r.source_hash, r.translated_text]),
    );

    // Build the list of items that still need to be translated.
    const missingIdx: number[] = [];
    data.texts.forEach((_, i) => {
      if (!cacheMap.has(hashes[i])) missingIdx.push(i);
    });

    if (missingIdx.length === 0) {
      return { translations: data.texts.map((src, i) => cacheMap.get(hashes[i]) ?? src) };
    }

    // Hard per-request cap on how many new strings will actually hit the paid
    // gateway. Anything above this returns as source text; still cheaper than
    // running up unbounded credits.
    const MAX_NEW_PER_CALL = 20;
    const toTranslateIdx = missingIdx.slice(0, MAX_NEW_PER_CALL);

    const sys =
      "You are a professional UI translator for BeistandPlus, a German welfare & settlement platform. " +
      "You will receive a JSON array of items, each with an integer `i` (id) and a string `s` (source text). " +
      "Translate each `s` into " +
      data.targetName +
      " (code: " +
      data.targetLang +
      "). " +
      "Rules: (1) Keep meaning, tone and length close to the source — this is UI copy; do NOT merge, split, or reorder items. " +
      "(2) Preserve placeholders like {{name}}, {count}, %s, <b>...</b>, URLs and emails EXACTLY. " +
      "(3) Never translate the brand name 'BeistandPlus' or product names. " +
      "(4) If an item is already in " +
      data.targetName +
      ", return it unchanged. " +
      '(5) Return ONLY a JSON object of the form {"t":[{"i":0,"v":"..."}, ...]} with EXACTLY one entry per input `i`, same ids, same count. ' +
      "(6) No commentary, no markdown fences.";

    // Only translate the strings not already in cache.
    const items = toTranslateIdx.map((origIdx, i) => ({ i, s: data.texts[origIdx] }));
    const user = JSON.stringify({ items });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[translate] gateway ${res.status}: ${body}`);
      return { translations: data.texts.map((src, i) => cacheMap.get(hashes[i]) ?? src) };
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { t?: unknown } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { translations: data.texts.map((src, i) => cacheMap.get(hashes[i]) ?? src) };
    }
    const arr = Array.isArray(parsed.t) ? (parsed.t as unknown[]) : [];
    const byLocalId = new Map<number, string>();
    for (const entry of arr) {
      if (entry && typeof entry === "object") {
        const e = entry as { i?: unknown; v?: unknown };
        if (typeof e.i === "number" && typeof e.v === "string" && e.v.trim().length > 0) {
          byLocalId.set(e.i, e.v);
        }
      }
    }

    // Assemble final translations and persist newly-produced ones to cache.
    const rowsToCache: {
      target_lang: string;
      source_hash: string;
      source_text: string;
      translated_text: string;
    }[] = [];
    const translations = data.texts.map((src, origIdx) => {
      const cachedVal = cacheMap.get(hashes[origIdx]);
      if (cachedVal) return cachedVal;
      const localIdx = toTranslateIdx.indexOf(origIdx);
      if (localIdx === -1) return src; // exceeded MAX_NEW_PER_CALL
      const v = byLocalId.get(localIdx);
      if (!v) return src;
      if (src.length >= 3 && v.length > Math.max(60, src.length * 6)) return src;
      rowsToCache.push({
        target_lang: data.targetLang,
        source_hash: hashes[origIdx],
        source_text: src,
        translated_text: v,
      });
      return v;
    });

    if (rowsToCache.length > 0) {
      // Fire-and-forget cache write; ignore conflicts on primary key.
      await supabaseAdmin
        .from("translation_cache")
        .upsert(rowsToCache, { onConflict: "target_lang,source_hash", ignoreDuplicates: true });
    }

    return { translations };
  });
