import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { approvedAppsQuery } from "@/lib/queries";
import { CATEGORIES } from "@/lib/categories";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — APPLIFYR" },
      {
        name: "description",
        content:
          "Every category in the APPLIFYR directory, from productivity and finance to AI tools and system utilities.",
      },
      { property: "og:title", content: "Categories — APPLIFYR" },
      {
        property: "og:description",
        content: "Browse the APPLIFYR directory by category.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(approvedAppsQuery),
  component: Categories,
});

function Categories() {
  const { data: apps } = useSuspenseQuery(approvedAppsQuery);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const app of apps) {
      if (!app.category) continue;
      map.set(app.category, (map.get(app.category) ?? 0) + 1);
    }
    return map;
  }, [apps]);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <p className="label-mono text-accent">Browse by category</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
        {CATEGORIES.length} categories
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Categories are fixed so the directory stays comparable. A category with no listings yet is
        still shown — it usually means nobody has submitted a good one.
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((item) => {
          const count = counts.get(item.slug) ?? 0;
          return (
            <Link
              key={item.slug}
              to="/category/$category"
              params={{ category: item.slug }}
              className="flex items-center justify-between gap-4 rounded-lg border border-border/80 bg-card/60 px-5 py-4 transition-colors hover:border-accent/60"
            >
              <span className="font-display text-base font-semibold text-foreground">
                {item.label}
              </span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">{count}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
