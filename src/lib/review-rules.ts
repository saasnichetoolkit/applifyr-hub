// Browser-safe rule for turning an AI verdict into a listing status.
export type ReviewVerdict = {
  reachable: boolean;
  is_legitimate_saas: boolean;
  confidence: number; // 0-1
  rating: number; // 0-10
};

export const MIN_CONFIDENCE = 0.7;

export function decideStatus(v: ReviewVerdict): "approved" | "rejected" {
  if (!v.reachable) return "rejected";
  if (!v.is_legitimate_saas) return "rejected";
  if (v.confidence < MIN_CONFIDENCE) return "rejected";
  return "approved";
}

export function clampRating(r: number): number {
  if (!Number.isFinite(r)) return 0;
  return Math.round(Math.min(10, Math.max(0, r)) * 10) / 10;
}
