import { describe, expect, it } from "vitest";

import { slugify, submissionRow, type SubmissionInput } from "@/lib/submission";

const input: SubmissionInput = {
  title: "TrueMargin AI",
  tagline: "Know your real margin before you launch",
  description: "A finance tool that models unit economics from a CSV of orders.",
  website_url: "https://truemargin.ai",
  category: "finance",
};

describe("Public submissions", () => {
  it("creates every app hidden from the directory", () => {
    const row = submissionRow(input, "truemargin-ai");

    expect(row.status).toBe("pending");
    expect(row.is_featured).toBe(false);
    expect(row.is_verified).toBe(false);
    expect(row.source).toBe("submit_form");
    expect(row.source_id).toBeNull();
    expect(row.slug).toBe("truemargin-ai");
  });

  it("ignores a status or badge a caller tries to send with the form", () => {
    const sneaky = {
      ...input,
      status: "featured",
      is_featured: true,
      is_verified: true,
    } as SubmissionInput;

    const row = submissionRow(sneaky, "truemargin-ai");

    expect(row.status).toBe("pending");
    expect(row.is_featured).toBe(false);
    expect(row.is_verified).toBe(false);
  });

  it("turns a title into a url-safe slug", () => {
    expect(slugify("Book Launch Desk")).toBe("book-launch-desk");
    expect(slugify("  ")).toBe("app");
  });
});

describe("Submission images", () => {
  it("keeps at most 6 screenshots and stores a missing icon as empty", () => {
    const urls = Array.from({ length: 9 }, (_, i) => `https://x.com/${i}.png`);
    const row = submissionRow({ ...input, screenshot_urls: urls, icon_url: "" }, "x");
    expect(row.screenshot_urls).toHaveLength(6);
    expect(row.icon_url).toBeNull();
  });
});
