import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { CATEGORIES, CATEGORY_SLUGS } from "@/lib/categories";

export type AppSuggestion = {
  title: string;
  tagline: string;
  description: string;
  category: string;
  icon_url: string | null;
  screenshot_url: string | null;
};

const inputSchema = z
  .object({
    url: z.string().trim().url().max(500).optional(),
    // Data URL of an uploaded screenshot/logo (png/jpeg/webp), capped around 4MB.
    image: z
      .string()
      .max(5_600_000)
      .regex(/^data:image\/(png|jpe?g|webp);base64,/)
      .optional(),
  })
  .refine((v) => v.url || v.image, "Add a website link or an image first");

function pick(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m?.[1]?.trim() || null;
}

function absolute(href: string | null, base: string): string | null {
  if (!href) return null;
  try {
    const u = new URL(href, base);
    return /^https?:$/.test(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function readPage(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ApplifyrBot/1.0)", Accept: "text/html" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`That website answered with an error (${res.status}).`);
  const html = (await res.text()).slice(0, 400_000);
  const meta = (name: string) =>
    pick(html, new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)`, "i")) ??
    pick(html, new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`, "i"));
  const icon =
    pick(html, /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)/i) ??
    pick(html, /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)/i) ??
    "/favicon.ico";
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 6000);
  return {
    title: pick(html, /<title[^>]*>([^<]+)/i),
    description: meta("description") ?? meta("og:description"),
    ogTitle: meta("og:title"),
    ogImage: absolute(meta("og:image"), res.url || url),
    icon: absolute(icon, res.url || url),
    text,
  };
}

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "tagline", "description", "category"],
  properties: {
    title: { type: "string", description: "The app's product name" },
    tagline: { type: "string", description: "One line, 8-140 characters" },
    description: {
      type: "string",
      description: "2-4 plain sentences: what it does, who it's for, what makes it different. 60-900 characters.",
    },
    category: { type: "string", enum: CATEGORY_SLUGS },
  },
};

async function askModel(content: unknown[]) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("The auto-fill service isn't configured.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions:
        "You write listings for APPLIFYR, a curated directory of indie web apps. From the material given, extract the app's name and write a neutral, factual tagline and description. Never invent features that aren't supported by the material. Pick the single best category slug. Categories: " +
        CATEGORIES.map((c) => `${c.slug} (${c.label})`).join(", "),
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "app_listing", strict: true, schema } },
    }),
  });

  if (!res.ok || !res.body) {
    if (res.status === 429) throw new Error("Auto-fill is busy right now. Try again in a minute.");
    if (res.status === 402) throw new Error("Auto-fill is paused: the AI credits for this site have run out.");
    const body = await res.text().catch(() => "");
    let message = "";
    try {
      message = JSON.parse(body)?.error?.message ?? "";
    } catch {}
    throw new Error(message || `Auto-fill failed (${res.status}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        const event = JSON.parse(data);
        if (event.type === "response.output_text.delta") output += event.delta;
        if (event.type === "response.refusal.delta") throw new Error("The AI declined to describe this app.");
        if (event.type === "error" || event.type === "response.failed") {
          throw new Error(event.error?.message ?? event.response?.error?.message ?? "Auto-fill failed.");
        }
      }
    }
  }
  if (!output) throw new Error("Auto-fill returned nothing. Fill the fields in by hand.");
  return JSON.parse(output) as Pick<AppSuggestion, "title" | "tagline" | "description" | "category">;
}

export const suggestAppDetails = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<AppSuggestion> => {
    const content: unknown[] = [];
    let page: Awaited<ReturnType<typeof readPage>> | null = null;

    if (data.url) {
      try {
        page = await readPage(data.url);
      } catch (error) {
        if (!data.image) {
          throw new Error(error instanceof Error ? error.message : "Couldn't open that website.");
        }
      }
      if (page) {
        content.push({
          type: "input_text",
          text: `URL: ${data.url}\nTitle: ${page.ogTitle ?? page.title ?? ""}\nMeta description: ${page.description ?? ""}\nPage text: ${page.text}`,
        });
      }
    }
    if (data.image) {
      content.push({ type: "input_text", text: "Image of the app (screenshot or logo):" });
      content.push({ type: "input_image", image_url: data.image });
    }

    const ai = await askModel(content);
    return {
      title: ai.title.slice(0, 120),
      tagline: ai.tagline.slice(0, 160),
      description: ai.description.slice(0, 4000),
      category: CATEGORY_SLUGS.includes(ai.category) ? ai.category : "other",
      icon_url: page?.icon ?? null,
      screenshot_url: page?.ogImage ?? null,
    };
  });
