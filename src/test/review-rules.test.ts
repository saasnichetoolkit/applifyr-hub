import { describe, expect, it } from "vitest";
import { decideStatus } from "@/lib/review-rules";

const ok = { reachable: true, is_legitimate_saas: true, confidence: 0.9, rating: 8 };

describe("auto review", () => {
  it("approves a reachable, legitimate app", () => expect(decideStatus(ok)).toBe("approved"));
  it("rejects a site that can't be reached", () =>
    expect(decideStatus({ ...ok, reachable: false })).toBe("rejected"));
  it("rejects a non-SaaS site", () =>
    expect(decideStatus({ ...ok, is_legitimate_saas: false })).toBe("rejected"));
  it("rejects low-confidence verdicts", () =>
    expect(decideStatus({ ...ok, confidence: 0.5 })).toBe("rejected"));
});
