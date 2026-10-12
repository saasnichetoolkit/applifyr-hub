import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CATEGORY_SLUGS } from "@/lib/categories";

export const APP_FIELDS =
  "id, title, slug, tagline, description, website_url, rating, category, is_featured, is_verified, status, created_at";

export type DirectoryApp = {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  website_url: string | null;
  rating: number | null;
  category: string | null;
  is_featured: boolean;
  is_verified: boolean;
  status: string;
  created_at: string;
};

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "app";
}

async function adminClient(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// ---------- public reads ----------

export const listApprovedApps = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicClient } = await import("@/lib/supabase-public.server");
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("apps")
    .select(APP_FIELDS)
    .in("status", ["approved", "featured"])
    .order("is_featured", { ascending: false })
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DirectoryApp[];
});

export const getAppBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => {
    const slug = z.string().min(1).max(120).parse(input?.slug);
    return { slug };
  })
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("@/lib/supabase-public.server");
    const supabase = createPublicClient();

    const { data: app, error } = await supabase
      .from("apps")
      .select(APP_FIELDS)
      .eq("slug", data.slug)
      .in("status", ["approved", "featured"])
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (app ?? null) as DirectoryApp | null;
  });

// ---------- public submission ----------

const submitSchema = z.object({
  title: z.string().trim().min(2).max(120),
  tagline: z.string().trim().min(8).max(160),
  description: z.string().trim().min(40).max(4000),
  website_url: z
    .string()
    .trim()
    .url("Enter a full web address, including https://")
    .max(500)
    .refine((value) => /^https?:\/\//i.test(value), "The web address must start with http or https"),
  category: z.string().refine((value) => CATEGORY_SLUGS.includes(value), "Choose one of the listed categories"),
});

export const submitApp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("@/lib/supabase-public.server");
    const supabase = createPublicClient();
    const base = slugify(data.title);

    // The row is never read back: it is pending and hidden until an admin approves it.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
      const { error } = await supabase.from("apps").insert({
        title: data.title,
        slug,
        tagline: data.tagline,
        description: data.description,
        website_url: data.website_url,
        category: data.category,
        status: "pending",
        is_featured: false,
        is_verified: false,
        source: "submit_form",
        source_id: null,
      });

      if (!error) return { ok: true, slug };
      if (error.code !== "23505") throw new Error(error.message);
    }

    throw new Error("That app name is already taken. Try a slightly different title.");
  });

// ---------- auth helpers ----------

export const claimAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_admin_access");
    if (error) throw new Error(error.message);
    return Boolean(data);
  });

export const checkAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) return false;
    return Boolean(data);
  });

// ---------- admin review area ----------

export const listAdminApps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adminClient(context);

    const { data, error } = await context.supabase
      .from("apps")
      .select(APP_FIELDS)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as DirectoryApp[];
  });

type AppUpdate = {
  status?: "pending" | "approved" | "featured" | "rejected";
  is_featured?: boolean;
  is_verified?: boolean;
  title?: string;
  tagline?: string;
  description?: string;
  website_url?: string;
  category?: string;
  rating?: number;
};

const adminUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "featured", "rejected"]).optional(),
  is_featured: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  title: z.string().trim().min(2).max(120).optional(),
  tagline: z.string().trim().max(160).optional(),
  description: z.string().trim().max(4000).optional(),
  website_url: z.string().trim().url().max(500).optional(),
  category: z.string().refine((value) => CATEGORY_SLUGS.includes(value)).optional(),
  rating: z.coerce.number().min(0).max(10).optional(),
});

export const updateAppAsAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => adminUpdateSchema.parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    await adminClient(context);

    const { id, ...rest } = data;
    const patch = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined),
    ) as AppUpdate;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await context.supabase.from("apps").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
