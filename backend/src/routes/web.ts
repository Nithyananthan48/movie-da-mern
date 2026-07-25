import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { requireAdminPage } from "../middleware/auth.js";
import { normalizeToHundred } from "../services/scoring.js";
import { recomputeMovieScore } from "../services/recompute.js";

export const webRouter = Router();

function parseGenres(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

webRouter.get("/", async (req, res) => {
  const q = String(req.query.q ?? "");
  const genre = String(req.query.genre ?? "");
  const sort = String(req.query.sort ?? "latest");
  const minScore = Number(req.query.minScore ?? 0);

  const movies = await prisma.movie.findMany({
    where: q ? { title: { contains: q, mode: "insensitive" } } : undefined,
    include: { score: true },
    orderBy: { createdAt: "desc" }
  });

  let filtered = movies
    .filter((m) => (genre ? parseGenres(m.genres).includes(genre) : true))
    .filter((m) => (m.score?.aggregateScore ?? 0) >= minScore);

  if (sort === "score") {
    filtered = filtered.sort((a, b) => (b.score?.aggregateScore ?? 0) - (a.score?.aggregateScore ?? 0));
  } else if (sort === "year") {
    filtered = filtered.sort((a, b) => b.year - a.year);
  }

  const allGenres = [...new Set(movies.flatMap((m) => parseGenres(m.genres)))].sort();
  return res.render("home", { movies: filtered, filters: { q, genre, sort, minScore }, allGenres });
});

webRouter.get("/movie/:id", async (req, res) => {
  const movie = await prisma.movie.findUnique({
    where: { id: req.params.id },
    include: { score: true, ratings: { include: { source: true }, orderBy: { capturedAt: "desc" } } }
  });
  if (!movie) return res.status(404).send("Movie not found");
  return res.render("movie-detail", { movie, genres: parseGenres(movie.genres) });
});

webRouter.get("/admin/login", (_req, res) => res.render("admin-login", { error: "" }));

webRouter.post("/admin/login", async (req, res) => {
  const email = String(req.body.email ?? "");
  const password = String(req.body.password ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).render("admin-login", { error: "Invalid credentials" });
  }
  const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: "1d" });
  res.cookie("admin_token", token, { httpOnly: true, sameSite: "lax" });
  return res.redirect("/admin/dashboard");
});

webRouter.post("/admin/logout", (_req, res) => {
  res.clearCookie("admin_token");
  return res.redirect("/");
});

webRouter.get("/admin/dashboard", requireAdminPage, async (_req, res) => {
  const [movies, sources] = await Promise.all([
    prisma.movie.findMany({ include: { score: true }, orderBy: { createdAt: "desc" } }),
    prisma.ratingSource.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);
  return res.render("admin-dashboard", { movies, sources, status: "" });
});

webRouter.post("/admin/movies", requireAdminPage, async (req, res) => {
  const genres = String(req.body.genres ?? "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  await prisma.movie.create({
    data: {
      title: String(req.body.title ?? ""),
      year: Number(req.body.year ?? 2000),
      synopsis: String(req.body.synopsis ?? ""),
      genres
    }
  });
  return res.redirect("/admin/dashboard");
});

webRouter.post("/admin/ratings", requireAdminPage, async (req, res) => {
  const movieId = String(req.body.movieId ?? "");
  const sourceId = String(req.body.sourceId ?? "");
  const rawValue = Number(req.body.rawValue ?? 0);
  const source = await prisma.ratingSource.findUnique({ where: { id: sourceId } });
  if (!source) return res.redirect("/admin/dashboard");
  await prisma.movieRating.create({
    data: {
      movieId,
      sourceId,
      rawValue,
      normalizedValue: normalizeToHundred(rawValue, source.scaleMax)
    }
  });
  await recomputeMovieScore(movieId);
  return res.redirect("/admin/dashboard");
});
