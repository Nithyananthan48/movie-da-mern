import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const moviesRouter = Router();

moviesRouter.get("/", async (_req, res) => {
  const movies = await prisma.movie.findMany({
    include: { score: true },
    orderBy: { createdAt: "desc" }
  });
  res.json(movies);
});

moviesRouter.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "");
  const genre = String(req.query.genre ?? "");
  const year = req.query.year ? Number(req.query.year) : undefined;
  const movies = await prisma.movie.findMany({
    where: {
      title: { contains: q, mode: "insensitive" },
      ...(year ? { year } : {})
    },
    include: { score: true }
  });
  const filtered = genre
    ? movies.filter((movie) => Array.isArray(movie.genres) && movie.genres.includes(genre))
    : movies;
  res.json(filtered);
});

moviesRouter.get("/:id", async (req, res) => {
  const movie = await prisma.movie.findUnique({
    where: { id: req.params.id },
    include: {
      score: true,
      ratings: { include: { source: true }, orderBy: { capturedAt: "desc" } }
    }
  });
  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }
  return res.json(movie);
});
