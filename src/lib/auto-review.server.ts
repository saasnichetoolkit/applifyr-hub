// Server-only: AI review of a pending submission with Gemini via the Lovable AI Gateway.
import { readPage } from "@/lib/autofill.functions";
import { clampRating, decideStatus, type ReviewVerdict } from "@/lib/review-rules";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["is_legitimate_saas", "confidence", "rating", "summary", "reason"],
  properties: {
    is_legitimate_saas: { type: "boolean" },
    confidence: { type: "number", description: "0 to 1" },
    rating: { type: "number", description: "Quality score 0 to 10, one decimal" },
    summary: { type: "string", description: "2-4 neutral sentences describing the app" },
    reason: { type: "string", description: "One sentence explaining the verdict" },
  },
};

async function askGemini(text: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "google/gemini-3.8-flash",
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You review submissions to APPLIFYR, a curated directory of indie web apps. Decide whether the website is a real, working software product (SaaS / web app / tool) — not a parked domain, scam, adult/gambling site, placeholder, blog, or unrelated business. Be strict: if unsure, lower confidence. Rate quality 0-10 based on clarity, polish and usefulness.",
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_schema", json_schema: { name: "review", strict: true, schema } },
    }),
  });
  if (!res.ok || !res.body) throw new Error(`AI review failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let i: number;
    while ((i = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      const ev = JSON.parse(data);
      out += ev.choices?.[0]?.delta?.content ?? "";
    }
  }
  if (!out) throw new Error("AI review returned nothing");
  return JSON.parse(out) as {
    is_legitimate_saas: boolean;
    confidence: number;
    rating: number;
    summary: string;
    reason: string;
  };
}

// Reviews one pending app and updates its status. Leaves it pending if the AI itself fails.
export async function autoReviewApp(slug: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: app } = await supabaseAdmin
    .from("apps")
    .select("id, title, tagline, description, website_url, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!app || app.status !== "pending" || !app.website_url) return null;

  let page: Awaited<ReturnType<typeof readPage>> | null = null;
  try {
    page = await readPage(app.website_url);
  } catch {
    page = null;
  }

  let verdict: ReviewVerdict;
  let summary = app.description ?? "";
  if (!page) {
    verdict = { reachable: false, is_legitimate_saas: false, confidence: 1, rating: 0 };
  } else {
    try {
      const ai = await askGemini(
        `Submitted title: ${app.title}\nTagline: ${app.tagline ?? ""}\nSubmitter description: ${app.description ?? ""}\nURL: ${app.website_url}\nPage title: ${page.ogTitle ?? page.title ?? ""}\nMeta: ${page.description ?? ""}\nPage text: ${page.text}`,
      );
      verdict = { reachable: true, ...ai };
      if (ai.summary) summary = ai.summary.slice(0, 4000);
      console.log(`[auto-review] ${slug}: ${ai.reason}`);
    } catch (e) {
      console.error("[auto-review] AI failed, left pending:", e);
      return null;
    }
  }

  const status = decideStatus(verdict);
  await supabaseAdmin
    .from("apps")
    .update({
      status,
      rating: clampRating(verdict.rating),
      description: summary,
      is_verified: status === "approved",
    })
    .eq("id", app.id);
  return status;
}
