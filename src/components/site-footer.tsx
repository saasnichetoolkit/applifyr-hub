import { Link } from "@tanstack/react-router";

const PILLARS = ["Discover", "Amplify", "Distribute"];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/70 bg-surface/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-md bg-primary font-display text-xs font-bold text-primary-foreground">
              A
            </span>
            <span className="font-display text-base font-bold tracking-tight">APPLIFYR</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A curated directory of indie web apps. Every listing is reviewed by a human before it
            reaches the grid.
          </p>
          <p className="mt-4 font-mono text-[0.6875rem] tracking-[0.18em] text-accent uppercase">
            {PILLARS.join(" • ")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 text-sm">
          <div>
            <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">
              Directory
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/explore" className="text-foreground/80 hover:text-accent">
                  Explore all apps
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-foreground/80 hover:text-accent">
                  Categories
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">
              Builders
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/submit" className="text-foreground/80 hover:text-accent">
                  Submit an app
                </Link>
              </li>
              <li>
                <Link to="/sign-in" className="text-foreground/80 hover:text-accent">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-5 font-mono text-[0.6875rem] tracking-wider text-muted-foreground uppercase sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Applifyr</span>
          <span>Indie apps, hand-checked</span>
        </div>
      </div>
    </footer>
  );
}
