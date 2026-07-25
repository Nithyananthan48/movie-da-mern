import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT ?? 5000);
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

const movieSchema = new mongoose.Schema(
  {
    title: String,
    year: Number,
    genre: [String],
    language: String,
    runtime: Number,
    description: String,
    poster: String,
    ratings: {
      imdb: Number,
      audience: Number,
      critic: Number
    }
  },
  { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "user" },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
    watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }]
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

function aggregateScore(m: any) {
  const imdb = (m.ratings?.imdb ?? 0) * 10;
  const audience = m.ratings?.audience ?? 0;
  const critic = m.ratings?.critic ?? 0;
  return Number(((imdb * 0.4 + audience * 0.35 + critic * 0.25) / 1).toFixed(1));
}

function sanitizeUser(user: any) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

function getToken(req: express.Request) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

async function authUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    (req as any).user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  await authUser(req, res, () => {
    const user = (req as any).user;
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    return next();
  });
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!name || !email || password.length < 6) return res.status(400).json({ error: "Invalid payload" });
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: "Email already exists" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: "user" });
  const token = jwt.sign({ sub: String(user._id), role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  return res.status(201).json({ token, user: sanitizeUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ sub: String(user._id), role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token, user: sanitizeUser(user) });
});

app.get("/api/auth/me", authUser, async (req, res) => {
  return res.json({ user: sanitizeUser((req as any).user) });
});

app.get("/api/movies", async (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const genre = String(req.query.genre ?? "");
  const min = Number(req.query.min ?? 0);
  const sort = String(req.query.sort ?? "latest");
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(24, Math.max(1, Number(req.query.limit ?? 8)));

  let list = await Movie.find().lean();
  if (q) list = list.filter((m) => String(m.title).toLowerCase().includes(q));
  if (genre) list = list.filter((m) => Array.isArray(m.genre) && m.genre.includes(genre));

  const enriched = list
    .map((m) => ({ ...m, score: aggregateScore(m) }))
    .filter((m) => m.score >= min);

  if (sort === "score") enriched.sort((a, b) => b.score - a.score);
  else if (sort === "year") enriched.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  else enriched.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const total = enriched.length;
  const paged = enriched.slice((page - 1) * limit, (page - 1) * limit + limit);
  res.json({ items: paged, page, totalPages: Math.max(1, Math.ceil(total / limit)), total });
});

app.get("/api/movies/:id", async (req, res) => {
  const movie = await Movie.findById(req.params.id).lean();
  if (!movie) return res.status(404).json({ error: "Not found" });
  return res.json({ ...movie, score: aggregateScore(movie) });
});

app.post("/api/movies", async (req, res) => {
  const payload = req.body ?? {};
  const created = await Movie.create(payload);
  res.status(201).json(created);
});

app.post("/api/users/favorites/:movieId", authUser, async (req, res) => {
  const user = (req as any).user;
  const movieId = String(req.params.movieId);
  const has = user.favorites.some((id: any) => String(id) === movieId);
  user.favorites = has ? user.favorites.filter((id: any) => String(id) !== movieId) : [...user.favorites, movieId];
  await user.save();
  res.json({ favorites: user.favorites.map((id: any) => String(id)) });
});

app.post("/api/users/watchlist/:movieId", authUser, async (req, res) => {
  const user = (req as any).user;
  const movieId = String(req.params.movieId);
  const has = user.watchlist.some((id: any) => String(id) === movieId);
  user.watchlist = has ? user.watchlist.filter((id: any) => String(id) !== movieId) : [...user.watchlist, movieId];
  await user.save();
  res.json({ watchlist: user.watchlist.map((id: any) => String(id)) });
});

app.get("/api/users/lists", authUser, async (req, res) => {
  const user = (req as any).user;
  res.json({
    favorites: user.favorites.map((id: any) => String(id)),
    watchlist: user.watchlist.map((id: any) => String(id))
  });
});

app.post("/api/admin/movies", requireAdmin, async (req, res) => {
  const payload = req.body ?? {};
  const created = await Movie.create(payload);
  res.status(201).json(created);
});

app.put("/api/admin/movies/:id", requireAdmin, async (req, res) => {
  const updated = await Movie.findByIdAndUpdate(req.params.id, req.body ?? {}, { new: true });
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(updated);
});

app.delete("/api/admin/movies/:id", requireAdmin, async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

async function seedIfEmpty() {
  const tamilMovies = [
    ["Baasha", 1995, ["Action", "Drama"], 145, 8.4, 92, 84],
    ["Annamalai", 1992, ["Drama"], 168, 7.8, 88, 77],
    ["Padayappa", 1999, ["Drama", "Action"], 181, 8.1, 90, 80],
    ["Nayakan", 1987, ["Crime", "Drama"], 156, 8.6, 94, 89],
    ["Thalapathi", 1991, ["Drama"], 157, 8.5, 93, 88],
    ["Alaipayuthey", 2000, ["Romance", "Drama"], 156, 8.3, 91, 85],
    ["Kannathil Muthamittal", 2002, ["Drama"], 136, 8.4, 90, 87],
    ["Kaakha Kaakha", 2003, ["Action", "Crime"], 153, 8.1, 88, 82],
    ["Ghajini", 2005, ["Thriller", "Action"], 183, 8.4, 92, 86],
    ["Vaaranam Aayiram", 2008, ["Drama", "Romance"], 169, 8.2, 89, 81],
    ["Aadukalam", 2011, ["Drama"], 160, 8.0, 87, 82],
    ["Pizza", 2012, ["Thriller", "Horror"], 127, 8.0, 86, 80],
    ["Soodhu Kavvum", 2013, ["Comedy", "Crime"], 135, 8.2, 89, 84],
    ["Jigarthanda", 2014, ["Crime", "Comedy"], 171, 8.3, 90, 85],
    ["Kaithi", 2019, ["Action", "Thriller"], 145, 8.5, 92, 88],
    ["Vikram", 2022, ["Action", "Thriller"], 175, 8.4, 91, 86],
    ["Jai Bhim", 2021, ["Drama", "Legal"], 164, 8.8, 95, 92],
    ["96", 2018, ["Romance", "Drama"], 158, 8.5, 93, 90],
    ["Asuran", 2019, ["Drama", "Action"], 141, 8.4, 92, 88],
    ["Pariyerum Perumal", 2018, ["Drama"], 154, 8.6, 94, 91],
    ["Super Deluxe", 2019, ["Drama", "Thriller"], 176, 8.3, 90, 87],
    ["Maanagaram", 2017, ["Thriller"], 137, 8.1, 88, 84],
    ["Master", 2021, ["Action", "Thriller"], 179, 7.9, 85, 77],
    ["Sivaji", 2007, ["Action", "Drama"], 188, 7.6, 84, 74]
  ];

  const existingTitles = new Set((await Movie.find({}, { title: 1 }).lean()).map((m) => String(m.title)));
  const toInsert = tamilMovies
    .filter(([title]) => !existingTitles.has(String(title)))
    .map(([title, year, genre, runtime, imdb, audience, critic]) => ({
      title,
      year,
      genre,
      language: "Tamil",
      runtime,
      description: `${title} is a popular Tamil movie in the Moive Da collection.`,
      poster: `https://picsum.photos/seed/${encodeURIComponent(String(title))}/600/900`,
      ratings: { imdb, audience, critic }
    }));
  if (toInsert.length > 0) {
    await Movie.insertMany(toInsert);
  }
  const adminExists = await User.findOne({ email: "admin@moviehub.com" });
  if (!adminExists) {
    await User.create({
      name: "Admin",
      email: "admin@moviehub.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "admin",
      favorites: [],
      watchlist: []
    });
  }
}

async function start() {
  let uri = MONGO_URI;
  if (!uri) {
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri();
    console.log("Using in-memory MongoDB");
  }
  await mongoose.connect(uri);
  await seedIfEmpty();
  app.listen(PORT, () => console.log(`MERN backend running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error("Mongo connection failed:", err.message);
  process.exit(1);
});
