import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { ArrowUpRight, BadgeCheck, Star } from "lucide-react";

import { getAppBySlug } from "@/lib/apps.functions";
import { categoryLabel } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function appBySlugQuery(slug: string) {
  return queryOptions({
    queryKey: ["apps", "detail", slug],
    queryFn: () => getAppBySlug({ data: { slug } }),
    staleTime: 60_000,
  });
}

export const Route = createFileRoute("/app/$slug")({
  head: ({ params }) => {
    const slug = params.slug;
    const title = slug
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    return {
      meta: [
        { title: `${title} — APPLIFYR` },
        {
          name: "description",
          content: `${title} on APPLIFYR: an indie web app in the curated directory, with rating, category and a direct link to the site.`,
        },
        { property: "og:title", content: `${title} — APPLIFYR` },
        {
          property: "og:description",
          content: `See why ${title} is listed in the APPLIFYR directory of indie web apps.`,
        },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(appBySlugQuery(params.slug)),
  component: AppDetail,
});

function AppDetail() {
  const { slug } = Route.useParams();
  const { data: app } = useSuspenseQuery(appBySlugQuery(slug));

  if (!app) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-24 text-center">
        <p className="label-mono text-accent">Not listed</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
          That app isn't in the directory
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          It may still be in review, or it never cleared it.
        </p>
        <Button asChild className="mt-8 rounded-md">
          <a href="/explore">Back to the directory</a>
        </Button>
      </div>
    );
  }

  const rating = Number(app.rating ?? 0);

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14">
      <a
        href="/explore"
        className="font-mono text-xs tracking-wider text-muted-foreground uppercase transition-colors hover:text-accent"
      >
        ← Back to directory
      </a>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl leading-tight font-bold tracking-tight text-foreground md:text-5xl">
            {app.title}
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {app.tagline}
          </p>
        </div>
        <div className="rounded-xl border border-accent/30 bg-accent/10 px-5 py-4 text-center">
          <p className="font-mono text-3xl font-medium text-accent tabular-nums">
            {rating.toFixed(1)}
          </p>
          <p className="label-mono mt-1 text-muted-foreground">Rating</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-accent/35 text-accent">
          {categoryLabel(app.category)}
        </Badge>
        {app.is_verified ? (
          <Badge variant="outline" className="gap-1 border-border text-muted-foreground">
            <BadgeCheck className="size-3" />
            Verified
          </Badge>
        ) : null}
        {app.is_featured ? (
          <Badge variant="outline" className="gap-1 border-primary/45 text-primary-foreground/90">
            <Star className="size-3 fill-current" />
            Featured
          </Badge>
        ) : null}
      </div>

      <div className="mt-10 rounded-xl border border-border/70 bg-card/60 p-6 md:p-8">
        <p className="label-mono text-muted-foreground">About</p>
        <p className="mt-4 text-base leading-relaxed whitespace-pre-line text-foreground/90">
          {app.description ?? "No description was provided for this listing."}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {app.website_url ? (
          <Button asChild size="lg" className="rounded-md">
            <a href={app.website_url} target="_blank" rel="noopener">
              Visit Website
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">No website link recorded for this listing.</p>
        )}
        <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
          Listed {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}
