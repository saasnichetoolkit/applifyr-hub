import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Compass, Radar, Rocket } from "lucide-react";
import { useMemo, useState } from "react";

import { AppCard } from "@/components/app-card";
import { ALL_CATEGORIES, DirectoryControls } from "@/components/directory-controls";
import { approvedAppsQuery } from "@/lib/queries";
import { CATEGORY_SLUGS } from "@/lib/categories";
import { Button } from "@/components/ui/button";

const PILLARS = [
  {
    title: "Discover",
    icon: Compass,
    copy: "Hand-checked indie apps, picked for what they actually do rather than how loudly they launch.",
  },
  {
    title: "Amplify",
    icon: Radar,
    copy: "Ratings and verified badges come from the editorial pass, so the front page stays worth reading.",
  },
  {
    title: "Distribute",
    icon: Rocket,
    copy: "Every listing carries a live link, so a useful tool can reach the people who need it today.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "APPLIFYR — Discover apps worth using." },
      {
        name: "description",
        content:
          "Browse a curated directory of indie web apps: discover tools worth using, amplify the good ones, and distribute your own build to readers.",
      },
      { property: "og:title", content: "APPLIFYR — Discover apps worth using." },
      {
        property: "og:description",
        content:
          "A curated directory of indie web apps. Search the grid, browse categories, or submit your own build for review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(approvedAppsQuery),
  component: Index,
});

function Index() {
  const { data: apps } = useSuspenseQuery(approvedAppsQuery);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);

  const stats = useMemo(() => {
    const ratings = apps
      .map((a) => Number(a.rating ?? 0))
      .filter((value) => Number.isFinite(value) && value > 0);
    const average = ratings.length
      ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
      : 0;
    const categories = new Set(apps.map((a) => a.category).filter(Boolean));
    return {
      apps: apps.length,
      categories: categories.size,
      average,
      verified: apps.filter((a) => a.is_verified).length,
    };
  }, [apps]);

  const featured = useMemo(() => apps.filter((a) => a.is_featured).slice(0, 3), [apps]);

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
    <div className="glow-indigo">
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="glow-aqua absolute inset-0 -z-10" aria-hidden />
        <div className="mx-auto w-full max-w-6xl px-5 pt-20 pb-16 md:pt-28 md:pb-24">
          <p className="label-mono text-accent">Discover • Amplify • Distribute</p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.05] font-bold tracking-tight text-foreground md:text-7xl">
            Discover apps worth using.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            APPLIFYR is a curated directory of indie web apps. No launch-day noise, no pay-to-rank —
            just tools people keep opening, checked by a human before they reach the grid.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-md">
              <a href="#all-apps">
                Browse the grid
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-md">
              <a href="/submit">Submit an app</a>
            </Button>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/40 md:grid-cols-4">
            <Stat label="Apps listed" value={String(stats.apps)} />
            <Stat label="Categories" value={`${stats.categories} / ${CATEGORY_SLUGS.length}`} />
            <Stat label="Avg rating" value={stats.average ? stats.average.toFixed(1) : "—"} />
            <Stat label="Verified" value={String(stats.verified)} />
          </dl>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-xl border border-border/70 bg-card/60 p-6"
            >
              <pillar.icon className="size-5 text-accent" />
              <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
                {pillar.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-5 pb-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="label-mono text-accent">Featured this week</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
                Editor picks
              </h2>
            </div>
            <a
              href="/explore"
              className="font-mono text-xs tracking-wider text-muted-foreground uppercase transition-colors hover:text-accent"
            >
              See all
            </a>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {featured.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      ) : null}

      <section id="all-apps" className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-14">
        <div className="flex flex-col gap-6">
          <div>
            <p className="label-mono text-accent">All apps</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
              The whole grid
            </h2>
          </div>

          <DirectoryControls
            query={query}
            onQueryChange={setQuery}
            category={category}
            onCategoryChange={setCategory}
          />

          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
              <p className="font-display text-lg font-semibold text-foreground">
                Nothing matches that yet
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a different word, or clear the category filter.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="for-builders" className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-8">
        <div className="glow-aqua rounded-2xl border border-border/70 bg-card/60 p-8 md:p-12">
          <p className="label-mono text-accent">For builders</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Built an app/tool that people need, or that solves a common problem — that has yet
            to be noticed?
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Send it in. Every submission lands in a review queue and gets read before it appears —
            no auto-publish, no listings that exist only to sell you a badge.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-md">
              <a href="/submit">
                Submit an app
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wider text-muted-foreground uppercase">
              <BadgeCheck className="size-3.5 text-accent" />
              Reviewed automatically
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/80 px-5 py-6">
      <dt className="label-mono text-muted-foreground">{label}</dt>
      <dd className="mt-2 font-mono text-3xl font-medium text-foreground tabular-nums">{value}</dd>
    </div>
  );
}
