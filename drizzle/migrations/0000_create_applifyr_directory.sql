-- APPLIFYR: curated directory of indie web apps
-- Order: tables -> grants -> functions -> RLS -> policies -> seed

-- ---------- user_roles ----------
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','moderator','user')),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- ---------- has_role (defined before any policy uses it) ----------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;

-- ---------- apps ----------
CREATE TABLE public.apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  tagline text,
  description text,
  website_url text,
  rating numeric(3,1) DEFAULT 0,
  category text,
  is_featured boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','featured','rejected')),
  source text,
  source_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX apps_slug_key ON public.apps (slug);
CREATE UNIQUE INDEX apps_source_source_id_key ON public.apps (source, source_id);
CREATE INDEX apps_status_idx ON public.apps (status);
CREATE INDEX apps_category_idx ON public.apps (category);

GRANT SELECT, INSERT ON public.apps TO anon;
GRANT SELECT, INSERT, UPDATE ON public.apps TO authenticated;
GRANT ALL ON public.apps TO service_role;

-- ---------- admin_email_allowlist ----------
CREATE TABLE public.admin_email_allowlist (
  email text PRIMARY KEY
);

GRANT ALL ON public.admin_email_allowlist TO service_role;

-- ---------- enable RLS ----------
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_email_allowlist ENABLE ROW LEVEL SECURITY;

-- ---------- policies ----------
CREATE POLICY user_roles_read_own
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Anyone can see apps that have been cleared for publication.
CREATE POLICY apps_public_select
  ON public.apps FOR SELECT TO anon, authenticated
  USING (status IN ('approved','featured'));

-- Admins see everything, including pending and rejected rows.
CREATE POLICY apps_admin_select
  ON public.apps FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Submissions are always pending and unverified; nobody can self-approve.
CREATE POLICY apps_insert_pending
  ON public.apps FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND is_featured = false
    AND is_verified = false
  );

-- Only admins change publication state.
CREATE POLICY apps_admin_update
  ON public.apps FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- allowlist seed ----------
INSERT INTO public.admin_email_allowlist (email) VALUES ('saas.niche.tool.kit@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- ---------- claim_admin_access ----------
CREATE OR REPLACE FUNCTION public.claim_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_allowed boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  SELECT EXISTS (
    SELECT 1 FROM public.admin_email_allowlist
    WHERE lower(email) = lower(v_email)
  ) INTO v_allowed;

  IF NOT v_allowed THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_admin_access() TO authenticated;

-- ---------- app seed ----------
INSERT INTO public.apps (title, slug, tagline, description, website_url, rating, category, is_featured, is_verified, status, source)
VALUES
  ('Book Launch Desk', 'book-launch-desk', 'One workspace to plan, write and launch your book.',
   'Book Launch Desk keeps the whole launch in one place: outline and chapter drafts, a countdown schedule, the beta-reader list, press and podcast outreach, and a launch-day checklist. Built for indie authors who want a calm plan instead of a pile of spreadsheets.',
   'https://booklaunchdesk.com', 9.3, 'productivity', true, true, 'featured', 'seed'),
  ('TrueMargin AI', 'truemargin-ai', 'See your real margin on every product.',
   'TrueMargin AI pulls your store, ad and fulfilment numbers together and shows the profit left after fees, shipping, returns and ads, per product and per channel. It flags the SKUs quietly losing money before the quarter ends.',
   'https://truemargin.ai', 9.6, 'finance', true, true, 'featured', 'seed'),
  ('Up All Good', 'up-all-good', 'A gentle sleep-and-wind-down companion.',
   'Up All Good helps you build a bedtime that actually sticks: a wind-down reminder, a short screen-free routine, a sleep window that adapts to your week, and calm weekly check-ins instead of a wall of sleep data.',
   'https://upallgood.app', 9.1, 'other', false, true, 'approved', 'seed')
ON CONFLICT (slug) DO NOTHING;