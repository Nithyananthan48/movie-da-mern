import type { Movie, MovieDetail } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export const movieApi = {
  list: () => api<Movie[]>("/api/movies"),
  search: (q: string) => api<Movie[]>(`/api/movies/search?q=${encodeURIComponent(q)}`),
  detail: (id: string) => api<MovieDetail>(`/api/movies/${id}`)
};

export const adminApi = {
  login: (email: string, password: string) =>
    api<{ token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  createMovie: (token: string, payload: unknown) =>
    api<Movie>("/api/admin/movies", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  addRating: (token: string, movieId: string, payload: unknown) =>
    api(`/api/admin/movies/${movieId}/ratings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
};
