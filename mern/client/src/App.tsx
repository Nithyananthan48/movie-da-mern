import { useEffect, useMemo, useState } from "react";

type Movie = {
  _id: string;
  title: string;
  year: number;
  genre: string[];
  language: string;
  runtime: number;
  description: string;
  poster: string;
  score: number;
};

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
type User = { id: string; name: string; email: string; role: "user" | "admin" };

export function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [min, setMin] = useState(0);
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [selected, setSelected] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [adminForm, setAdminForm] = useState({
    id: "",
    title: "",
    year: 2024,
    language: "English",
    runtime: 120,
    genre: "Drama",
    description: "",
    poster: "",
    imdb: 8,
    audience: 80,
    critic: 75
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/movies?q=${encodeURIComponent(q)}&genre=${genre}&min=${min}&sort=${sort}&page=${page}&limit=8`)
      .then((r) => r.json())
      .then((d) => {
        setMovies(d.items ?? []);
        setTotalPages(d.totalPages ?? 1);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [q, genre, min, sort, page]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ?? null))
      .catch(() => setUser(null));
    fetch(`${API}/api/users/lists`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setFavorites(d?.favorites ?? []);
        setWatchlist(d?.watchlist ?? []);
      })
      .catch(() => {
        setFavorites([]);
        setWatchlist([]);
      });
  }, [token]);

  const genres = useMemo(() => [...new Set(movies.flatMap((m) => m.genre || []))], [movies]);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  async function authSubmit() {
    const path = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      authMode === "login"
        ? { email: authForm.email, password: authForm.password }
        : { name: authForm.name, email: authForm.email, password: authForm.password };
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return showToast(data.error || "Auth failed");
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    showToast(authMode === "login" ? "Logged in" : "Account created");
  }

  async function toggleList(type: "favorites" | "watchlist", movieId: string) {
    if (!token) return showToast("Login first");
    const res = await fetch(`${API}/api/users/${type}/${movieId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) return showToast(data.error || "Action failed");
    if (type === "favorites") setFavorites(data.favorites ?? []);
    else setWatchlist(data.watchlist ?? []);
    showToast(type === "favorites" ? "Favorites updated" : "Watchlist updated");
  }

  async function adminSave(mode: "create" | "update" | "delete") {
    if (!token) return showToast("Login as admin");
    const payload = {
      title: adminForm.title,
      year: Number(adminForm.year),
      genre: adminForm.genre.split(",").map((s) => s.trim()),
      language: adminForm.language,
      runtime: Number(adminForm.runtime),
      description: adminForm.description,
      poster: adminForm.poster || `https://picsum.photos/seed/${encodeURIComponent(adminForm.title)}/600/900`,
      ratings: { imdb: Number(adminForm.imdb), audience: Number(adminForm.audience), critic: Number(adminForm.critic) }
    };
    const method = mode === "create" ? "POST" : mode === "update" ? "PUT" : "DELETE";
    const url = mode === "create" ? `${API}/api/admin/movies` : `${API}/api/admin/movies/${adminForm.id}`;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: mode === "delete" ? undefined : JSON.stringify(payload)
    });
    if (!res.ok) return showToast("Admin action failed");
    showToast(`Movie ${mode} success`);
    setPage(1);
    fetch(`${API}/api/movies?q=${encodeURIComponent(q)}&genre=${genre}&min=${min}&sort=${sort}&page=1&limit=8`)
      .then((r) => r.json())
      .then((d) => {
        setMovies(d.items ?? []);
        setTotalPages(d.totalPages ?? 1);
      });
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>🎬 Moive Da 🍿</h1>
        <div className="actions">
          <button className="btn ghost" onClick={() => showToast("Welcome to advanced UI mode")}>Effects</button>
          <button className="btn ghost" onClick={() => setView(view === "grid" ? "list" : "grid")}>
            {view === "grid" ? "List View" : "Grid View"}
          </button>
          <button className="btn ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <section className="hero">
        <h2 className="glow">🔥 Tamil Cinema Collection Zone ✨</h2>
        <p>Filter, sort, switch themes, toggle view, pagination, skeleton loading, toasts, and account tools.</p>
        <p className="ticker">🎥 Trending Tamil vibes • 🎶 Iconic BGM feels • 🌟 Fan-favorite classics and modern hits</p>
      </section>

      <section className="panel auth">
        <input
          placeholder="Name (register)"
          value={authForm.name}
          onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
        />
        <input
          placeholder="Email"
          value={authForm.email}
          onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={authForm.password}
          onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
        />
        <button className="btn" onClick={authSubmit}>{authMode === "login" ? "Login" : "Register"}</button>
        <button className="btn ghost" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
          Switch to {authMode === "login" ? "Register" : "Login"}
        </button>
        <span>{user ? `Signed in: ${user.name} (${user.role})` : "Guest mode"}</span>
      </section>

      <section className="panel">
        <input placeholder="Search title..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="latest">Latest</option>
          <option value="score">Top score</option>
          <option value="year">Newest year</option>
        </select>
        <input type="range" min={0} max={100} value={min} onChange={(e) => setMin(Number(e.target.value))} />
        <span>Min score: {min}</span>
      </section>

      {user?.role === "admin" ? (
        <section className="panel admin">
          <input placeholder="Movie ID (for update/delete)" value={adminForm.id} onChange={(e) => setAdminForm({ ...adminForm, id: e.target.value })} />
          <input placeholder="Title" value={adminForm.title} onChange={(e) => setAdminForm({ ...adminForm, title: e.target.value })} />
          <input type="number" placeholder="Year" value={adminForm.year} onChange={(e) => setAdminForm({ ...adminForm, year: Number(e.target.value) })} />
          <input placeholder="Genres comma separated" value={adminForm.genre} onChange={(e) => setAdminForm({ ...adminForm, genre: e.target.value })} />
          <input placeholder="Language" value={adminForm.language} onChange={(e) => setAdminForm({ ...adminForm, language: e.target.value })} />
          <input type="number" placeholder="Runtime" value={adminForm.runtime} onChange={(e) => setAdminForm({ ...adminForm, runtime: Number(e.target.value) })} />
          <input placeholder="Poster URL" value={adminForm.poster} onChange={(e) => setAdminForm({ ...adminForm, poster: e.target.value })} />
          <input placeholder="Description" value={adminForm.description} onChange={(e) => setAdminForm({ ...adminForm, description: e.target.value })} />
          <input type="number" step="0.1" placeholder="IMDb (0-10)" value={adminForm.imdb} onChange={(e) => setAdminForm({ ...adminForm, imdb: Number(e.target.value) })} />
          <input type="number" placeholder="Audience (0-100)" value={adminForm.audience} onChange={(e) => setAdminForm({ ...adminForm, audience: Number(e.target.value) })} />
          <input type="number" placeholder="Critic (0-100)" value={adminForm.critic} onChange={(e) => setAdminForm({ ...adminForm, critic: Number(e.target.value) })} />
          <div className="actions">
            <button className="btn" onClick={() => adminSave("create")}>Create</button>
            <button className="btn" onClick={() => adminSave("update")}>Update</button>
            <button className="btn ghost" onClick={() => adminSave("delete")}>Delete</button>
          </div>
        </section>
      ) : null}

      <main className={view === "grid" ? "grid" : "list"}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="card skeleton" />)
          : movies.map((m) => (
          <article className="card" key={m._id} onClick={() => setSelected(m)}>
            <img src={m.poster} alt={m.title} />
            <div>
              <h3>{m.title}</h3>
              <p>{m.year} • {m.language} • {m.runtime} min</p>
              <p>{m.genre?.join(", ")}</p>
              <span className="badge">Score {m.score}</span>
              <div className="actions">
                <button
                  className={favorites.includes(m._id) ? "btn" : "btn ghost"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleList("favorites", m._id);
                  }}
                >
                  {favorites.includes(m._id) ? "Favorited" : "Favorite"}
                </button>
                <button
                  className={watchlist.includes(m._id) ? "btn" : "btn ghost"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleList("watchlist", m._id);
                  }}
                >
                  {watchlist.includes(m._id) ? "In Watchlist" : "Watchlist"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </main>

      <section className="pager">
        <button className="btn ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button className="btn ghost" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
      </section>

      {selected ? (
        <div className="modal" onClick={() => setSelected(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <h3>{selected.title}</h3>
            <p>{selected.description}</p>
            <button className="btn" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      ) : null}
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
