export type Movie = {
  id: string;
  title: string;
  year: number;
  synopsis?: string;
  posterUrl?: string;
  genres: string[];
  runtimeMin?: number;
  language?: string;
  score?: { aggregateScore: number; voteCount: number };
};

export type MovieDetail = Movie & {
  ratings: Array<{
    id: string;
    rawValue: number;
    normalizedValue: number;
    source: { id: string; name: string };
  }>;
};
