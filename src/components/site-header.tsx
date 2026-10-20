import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Explore", to: "/explore" },
  { label: "Categories", to: "/categories" },
  { label: "For Builders", to: "/#for-builders" },
];

export function SiteHeader() {
  const { session, ready, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid size-8 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
            A
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            APPLIFYR
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {ready && session ? (
            <Link to="/my-apps" className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-accent">
              My apps
            </Link>
          ) : null}
          {isAdmin ? (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-xs tracking-wider text-accent uppercase transition-colors hover:bg-accent/10"
            >
              <LayoutDashboard className="size-3.5" />
              Admin
            </Link>
          ) : null}

          {ready && session ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          ) : (
            <Link
              to="/sign-in"
              className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:border-accent/60 hover:text-accent"
            >
              Sign in
            </Link>
          )}

          <Button asChild size="sm" className="rounded-md px-3.5">
            <Link to="/submit">Submit an app</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid size-9 place-items-center rounded-md border border-border text-foreground md:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      <div
        className={cn(
          "grid overflow-hidden border-t border-border/60 transition-[grid-template-rows] duration-200 md:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-t-0",
        )}
      >
        <div className="min-h-0">
          <div className="flex flex-col gap-1 px-5 py-3">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            {ready && session ? (
              <Link to="/my-apps" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                My apps
              </Link>
            ) : null}
            {isAdmin ? (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 font-mono text-xs tracking-wider text-accent uppercase"
              >
                Admin
              </Link>
            ) : null}
            <div className="mt-2 flex items-center gap-2">
              <Button asChild size="sm" className="flex-1">
                <Link to="/submit" onClick={() => setOpen(false)}>
                  Submit an app
                </Link>
              </Button>
              {ready && session ? (
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign out
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link to="/sign-in" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
