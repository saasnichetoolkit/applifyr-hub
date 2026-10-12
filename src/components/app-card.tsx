import { Link } from "@tanstack/react-router";
import { BadgeCheck, Star } from "lucide-react";

import type { DirectoryApp } from "@/lib/apps.functions";
import { categoryLabel } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AppCard({ app, className }: { app: DirectoryApp; className?: string }) {
  const rating = typeof app.rating === "number" ? app.rating : Number(app.rating ?? 0);

  return (
    <Link
      to="/app/$slug"
      params={{ slug: app.slug }}
      className={cn(
        "group flex h-full flex-col rounded-xl border border-border/80 bg-card p-5 transition-colors hover:border-accent/60",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg leading-snug font-semibold text-foreground">
          {app.title}
        </h3>
        <span className="shrink-0 rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-xs font-medium text-accent">
          {rating.toFixed(1)}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {app.tagline ?? "No tagline yet."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
    </Link>
  );
}
