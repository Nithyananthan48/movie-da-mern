import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sources = [
    { name: "IMDb", scaleMax: 10, weight: 0.4 },
    { name: "RottenTomatoes", scaleMax: 100, weight: 0.35 },
    { name: "Metacritic", scaleMax: 100, weight: 0.25 }
  ];

  for (const src of sources) {
    await prisma.ratingSource.upsert({
      where: { name: src.name },
      update: src,
      create: src
    });
  }

  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
      role: "admin"
    }
  });

  const movie = await prisma.movie.upsert({
    where: { id: "seed-movie-1" },
    update: {},
    create: {
      id: "seed-movie-1",
      title: "Inception",
      year: 2010,
      synopsis: "A thief enters dreams to plant an idea.",
      genres: ["Sci-Fi", "Thriller"],
      runtimeMin: 148,
      language: "English"
    }
  });

  const dbSources = await prisma.ratingSource.findMany();
  for (const source of dbSources) {
    const rawValue = source.name === "IMDb" ? 8.8 : source.name === "RottenTomatoes" ? 87 : 74;
    const normalizedValue = (rawValue / source.scaleMax) * 100;
    await prisma.movieRating.create({
      data: {
        movieId: movie.id,
        sourceId: source.id,
        rawValue,
        normalizedValue
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
