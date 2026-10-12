import { createFileRoute } from "@tanstack/react-router";

import { CATEGORIES } from "@/lib/categories";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function collectApprovedApps(origin: string) {
  const { createPublicClient } = await import("@/lib/supabase-public.server");
  const supabase = createPublicClient();

  const urls: string[] = [];
  const pageSize = 1000;

  for (let page = 0; page < 50; page += 1) {
    const from = page * pageSize;
    const { data, error } = await supabase
      .from("apps")
      .select("slug, created_at")
      .in("status", ["approved", "featured"])
      .order("slug", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    const rows = data ?? [];

    for (const row of rows) {
      const lastmod = isoDate(row.created_at);
      urls.push(
        `  <url>\n    <loc>${escapeXml(`${origin}/app/${row.slug}`)}</loc>\n${
          lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""
        }  </url>`,
      );
    }

    if (rows.length < pageSize) break;
  }

  return urls;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;

        let appUrls: string[];
        try {
          appUrls = await collectApprovedApps(origin);
        } catch (error) {
          console.error("Sitemap generation failed:", error);
          return new Response("Sitemap unavailable", { status: 500 });
        }

        const staticUrls = [
          `  <url>\n    <loc>${escapeXml(`${origin}/`)}</loc>\n  </url>`,
          `  <url>\n    <loc>${escapeXml(`${origin}/explore`)}</loc>\n  </url>`,
          `  <url>\n    <loc>${escapeXml(`${origin}/categories`)}</loc>\n  </url>`,
          `  <url>\n    <loc>${escapeXml(`${origin}/submit`)}</loc>\n  </url>`,
        ];

        const categoryUrls = CATEGORIES.map(
          (category) =>
            `  <url>\n    <loc>${escapeXml(`${origin}/category/${category.slug}`)}</loc>\n  </url>`,
        );

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
          ...staticUrls,
          ...categoryUrls,
          ...appUrls,
        ].join("\n")}\n</urlset>\n`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
