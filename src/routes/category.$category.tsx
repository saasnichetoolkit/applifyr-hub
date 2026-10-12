import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { AppCard } from "@/components/app-card";
import { approvedAppsQuery } from "@/lib/queries";
import { categoryLabel, isKnownCategory } from "@/lib/categories";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/category/$category")({
  head: ({ params }) => {
    const label = categoryLabel(params.category);
    return {
      meta: [
        { title: `${label} apps — APPLIFYR` },
        {
          name: "description",
          content: `Indie web apps in the ${label} category, hand-checked before they reach the APPLIFYR grid.`,
        },
        { property: "og:title", content: `${label} apps — APPLIFYR` },
        {
          property: "og:description",
          content: `Indie web apps in the ${label} category, hand-checked before publication.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(approvedAppsQuery),
  component: CategoryPage,
});

function CategoryPage({ params }: { params: { category: string } }) {
  const { data: apps } = useSuspenseQuery(approvedAppsQuery);
  const known = isKnownCategory(params.category);
  const label = categoryLabel(params.category);

  const inCategory = useMemo(
    () => apps.filter((app) => app.category === params.category),
    [apps, params.category],
  );

  if (!known) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-24 text-center">
        <p className="label-mono text-accent">Unknown category</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
          No such category
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          “{params.category}” isn't one of the directory categories.
        </p>
        <Button asChild className="mt-8 rounded-md">
          <a href="/categories">All categories</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <p className="label-mono text-accent">Category</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
        {label}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        {inCategory.length > 0
          ? `${inCategory.length} ${inCategory.length === 1 ? "app has" : "apps have"} cleared review in this category.`
          : "Nothing has cleared review in this category yet. If you have built something that fits, send it in."}
      </p>

      {inCategory.length > 0 ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inCategory.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
          <p className="font-display text-lg font-semibold text-foreground">No listings yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Be the first app in this category to make the grid.
          </p>
          <Button asChild className="mt-6 rounded-md">
            <a href="/submit">Submit an app</a>
          </Button>
        </div>
      )}
    </div>
  );
}
