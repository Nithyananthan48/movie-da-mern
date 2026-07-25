import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";

export function AdminDashboardPage() {
  const token = localStorage.getItem("admin_token") ?? "";
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(2024);
  const [genres, setGenres] = useState("Drama");
  const [movieId, setMovieId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [rawValue, setRawValue] = useState(0);

  const createMovie = useMutation({
    mutationFn: () =>
      adminApi.createMovie(token, {
        title,
        year,
        genres: genres.split(",").map((x) => x.trim())
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["movies"] })
  });

  const addRating = useMutation({
    mutationFn: () => adminApi.addRating(token, movieId, { sourceId, rawValue: Number(rawValue) })
  });

  function onCreateMovie(e: FormEvent) {
    e.preventDefault();
    createMovie.mutate();
  }

  function onAddRating(e: FormEvent) {
    e.preventDefault();
    addRating.mutate();
  }

  return (
    <div className="stack">
      <section className="hero">
        <h1>Admin Dashboard</h1>
        <p>Token present: {token ? "yes" : "no"}</p>
      </section>

      <form onSubmit={onCreateMovie} className="card form-grid">
        <h2 className="section-title">Create movie</h2>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <input
          className="field"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          placeholder="Year"
          type="number"
        />
        <input
          className="field"
          value={genres}
          onChange={(e) => setGenres(e.target.value)}
          placeholder="Genres comma-separated"
        />
        <button className="btn" type="submit">
          Create
        </button>
      </form>

      <form onSubmit={onAddRating} className="card form-grid">
        <h2 className="section-title">Add rating</h2>
        <input className="field" value={movieId} onChange={(e) => setMovieId(e.target.value)} placeholder="Movie ID" />
        <input className="field" value={sourceId} onChange={(e) => setSourceId(e.target.value)} placeholder="Source ID" />
        <input
          className="field"
          value={rawValue}
          onChange={(e) => setRawValue(Number(e.target.value))}
          placeholder="Raw value"
          type="number"
        />
        <button className="btn" type="submit">
          Add rating
        </button>
      </form>
    </div>
  );
}
