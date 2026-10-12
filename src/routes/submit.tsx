import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { submitApp } from "@/lib/apps.functions";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit an app — APPLIFYR" },
      {
        name: "description",
        content:
          "Send your indie web app to APPLIFYR. Every submission is read by a human before it appears in the directory.",
      },
      { property: "og:title", content: "Submit an app — APPLIFYR" },
      {
        property: "og:description",
        content: "Send your indie web app to APPLIFYR for a human review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Submit,
});

function Submit() {
  const send = useServerFn(submitApp);
  const [category, setCategory] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);
    const payload = {
      website_url: String(form.get("website_url") ?? ""),
      title: String(form.get("title") ?? ""),
      tagline: String(form.get("tagline") ?? ""),
      description: String(form.get("description") ?? ""),
      category,
    };

    if (!category) {
      toast.error("Pick a category for your app.");
      return;
    }

    setPending(true);
    try {
      await send({ data: payload });
      setDone(true);
      toast.success("Submitted — it's in the review queue.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit that right now.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-24 text-center">
        <p className="label-mono text-accent">In review</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
          Thanks — it's in the queue
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          A person reads every submission before it reaches the grid. If it's a fit, it appears in
          the directory and shows up under its category.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-md">
            <a href="/explore">Browse the directory</a>
          </Button>
          <Button
            variant="outline"
            className="rounded-md"
            onClick={() => {
              setDone(false);
              setCategory("");
            }}
          >
            Submit another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-14">
      <p className="label-mono text-accent">Submit an app</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
        Tell us what you built
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Five fields, no account needed. Submissions stay hidden until an editor approves them.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">App name</Label>
          <Input id="title" name="title" required maxLength={120} placeholder="Book Launch Desk" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website_url">Website URL</Label>
          <Input
            id="website_url"
            name="website_url"
            type="url"
            required
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            name="tagline"
            required
            minLength={8}
            maxLength={160}
            placeholder="One line on what it does"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="bg-card">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((item) => (
                <SelectItem key={item.slug} value={item.slug}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            required
            minLength={40}
            maxLength={4000}
            rows={7}
            placeholder="What it does, who it's for, and what makes it different from the obvious alternative."
          />
          <p className="text-xs text-muted-foreground">
            Between 40 and 4,000 characters. Plain text reads best here.
          </p>
        </div>

        <Button type="submit" size="lg" disabled={pending} className="w-full rounded-md">
          {pending ? "Sending…" : "Submit for review"}
        </Button>
      </form>
    </div>
  );
}
