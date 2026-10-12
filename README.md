# Applifyr Hub

Build APPLIFYR (applifyr.com), a curated directory of indie web apps, using my connected Supabase project (NOT Lovable Cloud).



DESIGN

- Dark midnight navy theme: background #0B1020, warm white text, Indigo #4F46E5 for CTAs, Aqua #22D3EE for badges/accents.

- Fonts: Space Grotesk for headings, Inter for body, JetBrains Mono for stats/labels.

- Brand pillars shown in the hero: DISCOVER • AMPLIFY • DISTRIBUTE.

- Hero headline: "Discover apps worth using."



DATABASE (create via migration with RLS enabled on every table)

- apps: id uuid PK, title text, slug text unique, tagline text, description text, website_url text, rating numeric(3,1), category text, is_featured boolean default false, is_verified boolean default false, status text default 'pending' CHECK (status IN ('pending','approved','featured','rejected')), source text, source_id text, created_at timestamptz default now(). Unique index on (source, source_id).

- user_roles: id uuid PK, user_id uuid references auth.users(id) on delete cascade, role text CHECK (role IN ('admin','moderator','user')). Users can read only their own roles.

- admin_email_allowlist: email text. Seed with saas.niche.tool.kit@gmail.com.

- has_role(user_id, role) SECURITY DEFINER function for RLS checks.

- claim_admin_access() SECURITY DEFINER function: grants the admin role when the caller's email is in admin_email_allowlist.

- RLS on apps: anyone (anon + authenticated) can SELECT approved/featured rows; anyone can INSERT with status 'pending'; only admins can SELECT all rows and UPDATE.



PAGES

- Header: logo, Explore, Categories, For Builders, "Submit an app" CTA; shows Sign in / Sign out + Admin link based on auth state.

- Homepage (/): hero, stats row, "Featured this week" section, and an All Apps grid with client-side search and category filter.

- /explore: full directory grid with search + category dropdown and a friendly empty state.

- /categories: hub listing all categories; /category/$category: apps in one category.

- /app/$slug: app detail page with title, tagline, description, rating, category badge, and a "Visit Website" button (target _blank, rel noopener).

- /submit: public form (website URL, title, tagline, description, category). Submissions insert with status 'pending' and stay hidden until approved. Do NOT read the row back after insert.

- /sign-in: Google sign-in via Supabase OAuth; after sign-in, call claim_admin_access() and redirect to /admin if admin.

- /admin (authenticated, admin-only): tabs for Pending / Approved / Featured / Rejected. Each app has a Details dialog (description, category, rating, website, date, status) with Approve, Feature, and Reject actions, plus edit fields and a Sign out button. Unauthenticated visitors redirect to /sign-in; non-admins redirect to /.

- /sitemap.xml: dynamic sitemap of all approved apps and categories.



CATEGORIES (use these slugs)

productivity, finance, developer_tools, marketing_seo, design_creative, ai_tools, task_management, note_taking, time_tracking, automation, calendar_scheduling, file_management, email_management, distraction_blocking, api_tools, code_editors, devops_ci_cd, database_tools, testing_qa, security_dev, version_control, low_code_no_code, accounting_bookkeeping, payroll_hr, crm_sales, e_commerce_tools, marketing_automation, analytics_reporting, tax_compliance, investment_crypto, graphic_design, video_editing, audio_production, photo_editing, 3d_modeling, writing_content, presentation_deck, branding_identity, chatbots_conversational, image_generation, text_generation, data_analysis_ai, voice_synthesis, recommendation_engine, health_wellness, education_learning, social_networking, gaming_entertainment, travel_planning, real_estate, legal_compliance, reentry_workforce, security_privacy, system_utilities, other



SEED DATA (three real apps, all approved + verified)

1. Book Launch Desk — slug book-launch-desk, productivity, rating 9.3, featured

2. TrueMargin AI — slug truemargin-ai, finance, rating 9.6, featured

3. Up All Good — slug up-all-good, other, rating 9.1, not featured

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/55dbe069-2b0f-45df-8dc3-cdbcb09c19f5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
