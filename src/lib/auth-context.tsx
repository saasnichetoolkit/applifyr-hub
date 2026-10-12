import { useServerFn } from "@tanstack/react-start";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { checkAdminAccess } from "@/lib/apps.functions";
import { supabase } from "@/integrations/supabase/client";

type AuthValue = {
  session: Session | null;
  ready: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  ready: false,
  isAdmin: false,
  signOut: async () => {},
});

// One subscriber for the whole app: the root layout renders inside this provider,
// so header, admin gate and sign-in page all read the same state.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fetchAdmin = useServerFn(checkAdminAccess);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession ?? null);
      setReady(true);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!session) {
      setIsAdmin(false);
      return;
    }
    fetchAdmin({ data: undefined })
      .then((value) => {
        if (active) setIsAdmin(Boolean(value));
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });
    return () => {
      active = false;
    };
  }, [session, fetchAdmin]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  }, []);

  const value = useMemo(
    () => ({ session, ready, isAdmin, signOut }),
    [session, ready, isAdmin, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
