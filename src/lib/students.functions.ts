import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SubmitSchema = z.object({
  university: z.string().min(2).max(200),
  country: z.string().min(2).max(100).optional(),
  student_id_number: z.string().min(2).max(80).optional(),
  id_document_path: z.string().min(1),
  valid_until: z.string().optional(),
});

export const submitStudentVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => SubmitSchema.parse(raw))
  .handler(async ({ data, context }) => {
    // Replace any prior pending record.
    await context.supabase
      .from("student_verifications")
      .delete()
      .eq("user_id", context.userId)
      .eq("status", "pending");
    const { data: row, error } = await context.supabase
      .from("student_verifications")
      .insert({
        user_id: context.userId,
        university: data.university,
        country: data.country ?? null,
        student_id_number: data.student_id_number ?? null,
        id_document_path: data.id_document_path,
        valid_until: data.valid_until || null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getMyStudentVerification = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("student_verifications")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  });

export const listStudentVerifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ status: z.string().optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: internal } = await context.supabase.rpc("is_internal", {
      _user_id: context.userId,
    });
    if (!internal) throw new Error("Forbidden");
    let q = context.supabase
      .from("student_verifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const reviewStudentVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        discount_percent: z.number().int().min(0).max(100).optional(),
        reviewer_notes: z.string().max(1000).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: internal } = await context.supabase.rpc("is_internal", {
      _user_id: context.userId,
    });
    if (!internal) throw new Error("Forbidden");
    const patch = {
      status: data.status,
      reviewer_notes: data.reviewer_notes ?? null,
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
      ...(typeof data.discount_percent === "number"
        ? { discount_percent: data.discount_percent }
        : {}),
    };
    const { error } = await context.supabase
      .from("student_verifications")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const signStudentIdUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ filename: z.string().min(1).max(200) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const safe = data.filename.replace(/[^\w.\-]+/g, "_");
    const path = `student-ids/${context.userId}/${Date.now()}-${safe}`;
    const { data: signed, error } = await context.supabase.storage
      .from("vault")
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token };
  });
