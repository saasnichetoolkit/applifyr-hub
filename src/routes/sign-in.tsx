import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { claimAdminAccess } from "@/lib/apps.functions";
import { useAuth } from "@/lib/auth-context";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign in — APPLIFYR" },
      {
        name: "description",
        content: "Sign in to APPLIFYR with Google to manage submissions in the review queue.",
      },
      { property: "og:title", content: "Sign in — APPLIFYR" },
      {
        property: "og:description",
        content: "Sign in to APPLIFYR with Google.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const { session, ready } = useAuth();
  const claim = useServerFn(claimAdminAccess);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A session arriving here (returning from Google, or already signed in) resolves the
  // admin claim before choosing where to land.
  useEffect(() => {
    if (!ready || !session) return;
    let active = true;

    claim({ data: undefined })
      .then((isAdmin) => {
        if (!active) return;
        navigate({ to: isAdmin ? "/admin" : "/" });
      })
      .catch(() => {
        if (active) navigate({ to: "/" });
      });

    return () => {
      active = false;
    };
  }, [ready, session, claim, navigate]);

  async function signInWithGoogle() {
    setBusy(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError(result.error.message || "Google sign-in didn't start.");
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      toast.success("Signed in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in didn't start.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-5 py-24">
      <p className="label-mono text-accent">Welcome</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
        Sign in to APPLIFYR
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Sign-in is only for the review queue — browsing the directory never needs an account.
      </p>

      <div className="mt-10 rounded-xl border border-border/70 bg-card/60 p-6">
        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={busy}
          onClick={signInWithGoogle}
          className="w-full gap-3 rounded-md"
        >
          <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden focusable="false">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          {busy ? "Starting Google sign-in…" : "Continue with Google"}
        </Button>

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Emails on the allowlist get reviewer access automatically. Everyone else lands back on the
          directory.
        </p>
      </div>
    </div>
  );
}
