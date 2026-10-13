import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check, LogOut, Search, Star, X } from "lucide-react";
import { AutofillPanel } from "@/components/autofill-panel";
import { IconField, ScreenshotsField } from "@/components/image-fields";

import {
  checkAdminAccess,
  listAdminApps,
  updateAppAsAdmin,
  type DirectoryApp,
} from "@/lib/apps.functions";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const adminAppsQuery = queryOptions({
  queryKey: ["apps", "admin"],
  queryFn: () => listAdminApps({ data: undefined }),
});

const TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "featured", label: "Featured" },
  { value: "rejected", label: "Rejected" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Review queue — APPLIFYR" },
      {
        name: "description",
        content: "Moderate APPLIFYR submissions: approve, feature, edit or reject listed apps.",
      },
      { property: "og:title", content: "Review queue — APPLIFYR" },
      { property: "og:description", content: "Moderate APPLIFYR submissions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    const isAdmin = await checkAdminAccess({ data: undefined });
    if (!isAdmin) throw redirect({ to: "/" });
    await context.queryClient.ensureQueryData(adminAppsQuery);
  },
  component: Admin,
});

function Admin() {
  const { data: apps } = useSuspenseQuery(adminAppsQuery);
  const [tab, setTab] = useState<TabValue>("pending");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const q = query.trim().toLowerCase();
  const matches = apps.filter(
    (app) =>
      (category === "all" || app.category === category) &&
      (!q ||
        [app.title, app.tagline, app.description, app.website_url, app.slug, categoryLabel(app.category)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))),
  );
  const inTab = (value: TabValue) => matches.filter((app) => value === "all" || app.status === value);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono text-accent">Review queue</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground">
            {apps.length} submissions
          </h1>
        </div>
        <SignOut />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, tagline, website…"
            aria-label="Search listings"
            className="bg-card pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full bg-card sm:w-64" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)} className="mt-6">
        <TabsList className="flex-wrap">
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
              <span className="ml-2 font-mono text-xs text-muted-foreground tabular-nums">
                {inTab(item.value).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((item) => (
          <TabsContent key={item.value} value={item.value} className="mt-6">
            <AppTable apps={inTab(item.value)} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function SignOut() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      className="rounded-md"
      onClick={async () => {
        await signOut();
        navigate({ to: "/", replace: true });
      }}
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}

function AppTable({ apps }: { apps: DirectoryApp[] }) {
  if (apps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
        <p className="font-display text-lg font-semibold text-foreground">Nothing in this queue</p>
        <p className="mt-2 text-sm text-muted-foreground">
          New submissions land here as soon as someone sends one in.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card/60">
      {apps.map((app) => (
        <div key={app.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
            {app.icon_url ? <img src={app.icon_url} alt="" className="size-full object-cover" /> : <span className="font-display text-lg text-muted-foreground">{app.title[0]}</span>}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-base font-semibold text-foreground">{app.title}</p>
              {app.is_verified ? (
                <Badge variant="outline" className="text-accent">
                  Verified
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">{app.tagline}</p>
            <p className="mt-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
              {categoryLabel(app.category)} · {app.rating ?? "—"} ·{" "}
              {new Date(app.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          </div>
          <AppDialog app={app} />
        </div>
      ))}
    </div>
  );
}

function AppDialog({ app }: { app: DirectoryApp }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const mutate = useServerFn(updateAppAsAdmin);
  const [edit, setEdit] = useState(() => ({
    title: app.title,
    tagline: app.tagline ?? "",
    description: app.description ?? "",
    website_url: app.website_url ?? "",
    category: app.category ?? "other",
    rating: String(app.rating ?? ""),
    is_verified: app.is_verified,
    icon_url: app.icon_url ?? "",
    screenshot_urls: app.screenshot_urls ?? [],
  }));

  const save = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      mutate({ data: { id: app.id, ...patch } as never }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      toast.success("Saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function patch(field: keyof typeof edit, value: string | boolean | string[]) {
    setEdit((current) => ({ ...current, [field]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" className="rounded-md" onClick={() => setOpen(true)}>
        Details
      </Button>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{app.title}</DialogTitle>
          <DialogDescription>
            {categoryLabel(app.category)} · {app.status} · listed{" "}
            {new Date(app.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <AutofillPanel
            url={edit.website_url}
            onSuggest={(s) =>
              setEdit((c) => ({
                ...c,
                title: s.title,
                tagline: s.tagline,
                description: s.description,
                category: s.category,
                icon_url: c.icon_url || s.icon_url || "",
                screenshot_urls: c.screenshot_urls.length || !s.screenshot_url ? c.screenshot_urls : [s.screenshot_url],
              }))
            }
          />
          <IconField id={`icon-${app.id}`} value={edit.icon_url} onChange={(v) => patch("icon_url", v)} />
          <ScreenshotsField value={edit.screenshot_urls} onChange={(v) => patch("screenshot_urls", v)} />
          <div className="space-y-2">
            <Label htmlFor={`title-${app.id}`}>Title</Label>
            <Input
              id={`title-${app.id}`}
              value={edit.title}
              onChange={(event) => patch("title", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`tagline-${app.id}`}>Tagline</Label>
            <Input
              id={`tagline-${app.id}`}
              value={edit.tagline}
              onChange={(event) => patch("tagline", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`website-${app.id}`}>Website</Label>
            <Input
              id={`website-${app.id}`}
              value={edit.website_url}
              onChange={(event) => patch("website_url", event.target.value)}
            />
            {app.website_url ? (
              <a
                href={app.website_url}
                target="_blank"
                rel="noopener"
                className="inline-block font-mono text-xs text-accent hover:underline"
              >
                {app.website_url}
              </a>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={edit.category}
                onValueChange={(value) => patch("category", value)}
              >
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`rating-${app.id}`}>Rating (0–10)</Label>
              <Input
                id={`rating-${app.id}`}
                value={edit.rating}
                onChange={(event) => patch("rating", event.target.value)}
                placeholder="9.2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`description-${app.id}`}>Description</Label>
            <Textarea
              id={`description-${app.id}`}
              rows={6}
              value={edit.description}
              onChange={(event) => patch("description", event.target.value)}
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="size-4 accent-[var(--color-primary)]"
              checked={edit.is_verified}
              onChange={(event) => patch("is_verified", event.target.checked)}
            />
            Verified listing
          </label>
        </div>

        <DialogFooter className="mt-6 flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-md"
            disabled={save.isPending}
            onClick={() =>
              save.mutate({
                title: edit.title,
                tagline: edit.tagline,
                description: edit.description,
                website_url: edit.website_url,
                category: edit.category,
                rating: edit.rating === "" ? undefined : Number(edit.rating),
                is_verified: edit.is_verified,
                icon_url: edit.icon_url.trim(),
                screenshot_urls: edit.screenshot_urls,
              })
            }
          >
            Save changes
          </Button>
          <Button
            className="rounded-md"
            disabled={save.isPending}
            onClick={() => save.mutate({ status: "approved", is_featured: false })}
          >
            <Check className="size-4" />
            Approve
          </Button>
          <Button
            variant="secondary"
            className="rounded-md"
            disabled={save.isPending}
            onClick={() => save.mutate({ status: "featured", is_featured: true })}
          >
            <Star className="size-4" />
            Feature
          </Button>
          <Button
            variant="destructive"
            className="rounded-md"
            disabled={save.isPending}
            onClick={() => save.mutate({ status: "rejected", is_featured: false })}
          >
            <X className="size-4" />
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
