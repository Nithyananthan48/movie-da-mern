import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { normalizeToHundred } from "../services/scoring.js";
import { recomputeMovieScore } from "../services/recompute.js";

const movieSchema = z.object({
  title: z.string().min(1),
  year: z.number().int().min(1880).max(2100),
  synopsis: z.string().optional(),
  posterUrl: z.string().url().optional(),
  genres: z.array(z.string()).default([]),
  runtimeMin: z.number().int().positive().optional(),
  language: z.string().optional()
});

const ratingSchema = z.object({
  sourceId: z.string(),
  rawValue: z.number(),
  notes: z.string().optional()
});

export const adminRouter = Router();

adminRouter.post("/movies", async (req, res) => {
  const parsed = movieSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const movie = await prisma.movie.create({ data: parsed.data });
  res.status(201).json(movie);
});

adminRouter.put("/movies/:id", async (req, res) => {
  const parsed = movieSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const movie = await prisma.movie.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(movie);
});

adminRouter.delete("/movies/:id", async (req, res) => {
  await prisma.movie.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

adminRouter.post("/movies/:id/ratings", async (req, res) => {
  const parsed = ratingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const source = await prisma.ratingSource.findUnique({ where: { id: parsed.data.sourceId } });
  if (!source) return res.status(404).json({ error: "Source not found" });

  const rating = await prisma.movieRating.create({
    data: {
      movieId: req.params.id,
      sourceId: parsed.data.sourceId,
      rawValue: parsed.data.rawValue,
      normalizedValue: normalizeToHundred(parsed.data.rawValue, source.scaleMax),
      notes: parsed.data.notes
    }
  });
  await recomputeMovieScore(req.params.id);
  res.status(201).json(rating);
});

adminRouter.put("/ratings/:ratingId", async (req, res) => {
  const parsed = ratingSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const existing = await prisma.movieRating.findUnique({ where: { id: req.params.ratingId } });
  if (!existing) return res.status(404).json({ error: "Rating not found" });

  const source = await prisma.ratingSource.findUnique({ where: { id: parsed.data.sourceId ?? existing.sourceId } });
  if (!source) return res.status(404).json({ error: "Source not found" });
  const rawValue = parsed.data.rawValue ?? existing.rawValue;
  const rating = await prisma.movieRating.update({
    where: { id: req.params.ratingId },
    data: {
      sourceId: parsed.data.sourceId,
      rawValue,
      normalizedValue: normalizeToHundred(rawValue, source.scaleMax),
      notes: parsed.data.notes
    }
  });
  await recomputeMovieScore(existing.movieId);
  res.json(rating);
});

adminRouter.delete("/ratings/:ratingId", async (req, res) => {
  const existing = await prisma.movieRating.findUnique({ where: { id: req.params.ratingId } });
  if (!existing) return res.status(404).json({ error: "Rating not found" });
  await prisma.movieRating.delete({ where: { id: req.params.ratingId } });
  await recomputeMovieScore(existing.movieId);
  res.status(204).send();
});

adminRouter.post("/recompute/:movieId", async (req, res) => {
  await recomputeMovieScore(req.params.movieId);
  res.json({ ok: true });
});
