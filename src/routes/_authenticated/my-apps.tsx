import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Plus } from "lucide-react";

import { listMyApps } from "@/lib/apps.functions";
import { categoryLabel } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/my-apps")({
  head: () => ({
    meta: [
      { title: "My apps — APPLIFYR" },
      { name: "description", content: "Track the review status of the apps you submitted to APPLIFYR." },
      { property: "og:title", content: "My apps — APPLIFYR" },
      { property: "og:description", content: "Your APPLIFYR submissions and their review status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyApps,
});

const STATUS_COPY: Record<string, { label: string; note: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "In review", note: "Waiting for an editor.", variant: "secondary" },
  approved: { label: "Live", note: "Listed in the directory.", variant: "default" },
  featured: { label: "Featured", note: "Live and featured.", variant: "default" },
  rejected: { label: "Not accepted", note: "This one wasn't a fit.", variant: "destructive" },
};

function MyApps() {
  const fetchMine = useServerFn(listMyApps);
  const { data, isLoading, error } = useQuery({ queryKey: ["my-apps"], queryFn: () => fetchMine() });

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono text-accent">Submitter</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">My apps</h1>
          <p className="mt-3 text-sm text-muted-foreground">Everything you've submitted, and where it stands.</p>
        </div>
        <Button asChild className="rounded-md">
          <Link to="/submit"><Plus className="size-4" /> Submit an app</Link>
        </Button>
      </div>

      <div className="mt-10 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading your submissions…</p>}
        {error && <p className="text-sm text-destructive">Couldn't load your submissions. Try reloading.</p>}
        {data && data.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-foreground">You haven't submitted anything yet.</p>
            <Button asChild className="mt-5 rounded-md"><Link to="/submit">Submit your first app</Link></Button>
          </div>
        )}
        {data?.map((app) => {
          const s = STATUS_COPY[app.status] ?? STATUS_COPY["pending"]!;
          const live = app.status === "approved" || app.status === "featured";
          return (
            <div key={app.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
              {app.icon_url ? (
                <img src={app.icon_url} alt="" className="size-12 rounded-lg object-cover" />
              ) : (
                <div className="grid size-12 place-items-center rounded-lg bg-muted font-display text-lg text-foreground">{app.title[0]}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold text-foreground">{app.title}</p>
                <p className="truncate text-sm text-muted-foreground">{app.tagline}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {categoryLabel(app.category ?? "other")} · submitted {new Date(app.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={s.variant}>{s.label}</Badge>
                {live ? (
                  <Link to="/app/$slug" params={{ slug: app.slug }} className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                    View public listing <ExternalLink className="size-3" />
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">{s.note}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
