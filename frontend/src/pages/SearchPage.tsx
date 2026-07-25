import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { movieApi } from "../api";
import { MovieCard } from "../components/MovieCard";

export function SearchPage() {
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["search", q],
    queryFn: () => movieApi.search(q),
    enabled: q.length > 0
  });

  return (
    <div>
      <section className="hero">
        <h1>Search Movies</h1>
        <p>Type a title and instantly browse matching results.</p>
      </section>
      <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title" />
      <div className="grid">
        {data.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
