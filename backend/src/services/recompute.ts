import { prisma } from "../lib/prisma.js";
import { aggregateScore } from "./scoring.js";

export async function recomputeMovieScore(movieId: string) {
  const ratings = await prisma.movieRating.findMany({
    where: { movieId },
    include: { source: true }
  });
  const { score, voteCount } = aggregateScore(
    ratings.map((rating) => ({ rating, source: rating.source }))
  );

  await prisma.movieScore.upsert({
    where: { movieId },
    update: { aggregateScore: score, voteCount },
    create: { movieId, aggregateScore: score, voteCount }
  });
}
