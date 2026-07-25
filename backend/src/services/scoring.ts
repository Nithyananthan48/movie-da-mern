import type { MovieRating, RatingSource } from "@prisma/client";

export function normalizeToHundred(rawValue: number, scaleMax: number): number {
  if (scaleMax <= 0) {
    return 0;
  }
  const normalized = (rawValue / scaleMax) * 100;
  return Math.max(0, Math.min(100, normalized));
}

export function aggregateScore(items: Array<{ rating: MovieRating; source: RatingSource }>) {
  if (items.length === 0) {
    return { score: 0, voteCount: 0 };
  }
  const weighted = items.reduce(
    (acc, item) => {
      const w = item.source.weight;
      return {
        numerator: acc.numerator + item.rating.normalizedValue * w,
        denominator: acc.denominator + w
      };
    },
    { numerator: 0, denominator: 0 }
  );

  const score = weighted.denominator ? weighted.numerator / weighted.denominator : 0;
  return { score: Number(score.toFixed(2)), voteCount: items.length };
}
