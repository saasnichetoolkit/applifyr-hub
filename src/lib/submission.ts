// Browser-safe module: the row a public submission writes, and the slug it gets.
// Kept free of server imports so the rules can be unit-tested directly.

export type SubmissionInput = {
  title: string;
  tagline: string;
  description: string;
  website_url: string;
  category: string;
};

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "app";
}

export type SubmissionRow = SubmissionInput & {
  slug: string;
  status: "pending";
  is_featured: false;
  is_verified: false;
  source: "submit_form";
  source_id: null;
};

// A submission is always created hidden: pending, unfeatured, unverified.
// Nothing the caller sends can change that — the review queue is the only way in.
export function submissionRow(input: SubmissionInput, slug: string): SubmissionRow {
  return {
    title: input.title,
    tagline: input.tagline,
    description: input.description,
    website_url: input.website_url,
    category: input.category,
    slug,
    status: "pending",
    is_featured: false,
    is_verified: false,
    source: "submit_form",
    source_id: null,
  };
}
