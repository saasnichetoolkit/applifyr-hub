import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AppCard } from "@/components/app-card";
import { ALL_CATEGORIES, DirectoryControls } from "@/components/directory-controls";
import { approvedAppsQuery } from "@/lib/queries";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore the directory — APPLIFYR" },
      {
        name: "description",
        content:
          "Search and filter every approved indie web app in the APPLIFYR directory by name, tagline or category.",
      },
      { property: "og:title", content: "Explore the directory — APPLIFYR" },
      {
        property: "og:description",
        content: "Search and filter every approved indie web app in the APPLIFYR directory.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(approvedAppsQuery),
  component: Explore,
});

function Explore() {
  const { data: apps } = useSuspenseQuery(approvedAppsQuery);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return apps.filter((app) => {
      if (category !== ALL_CATEGORIES && app.category !== category) return false;
      if (!needle) return true;
      return [app.title, app.tagline, app.description, app.category]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });
  }, [apps, query, category]);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <p className="label-mono text-accent">Full directory</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
        Explore every listed app
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        {apps.length} apps have cleared review. Search by name or what the tool does, or narrow the
        grid to a single category.
      </p>

      <div className="mt-8">
        <DirectoryControls
          query={query}
          onQueryChange={setQuery}
          category={category}
          onCategoryChange={setCategory}
        />
      </div>

      <p className="mt-6 font-mono text-xs tracking-wider text-muted-foreground uppercase">
        {filtered.length} {filtered.length === 1 ? "result" : "results"}
      </p>

      {filtered.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card/40 p-14 text-center">
          <p className="font-display text-xl font-semibold text-foreground">No apps match yet</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Nothing here fits that search. Try a broader word, or reset the category filter to see
            the whole grid again.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory(ALL_CATEGORIES);
            }}
            className="mt-6 inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/60 hover:text-accent"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
