import { useQuery } from "@tanstack/react-query";
import { movieApi } from "../api";
import { MovieCard } from "../components/MovieCard";

export function HomePage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["movies"], queryFn: movieApi.list });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <section className="hero">
        <h1>Movie Rating Aggregator</h1>
        <p>Discover movies with normalized ratings from multiple sources in one cinematic dashboard.</p>
      </section>
      <h2 className="section-title">Trending and Recent</h2>
      <div className="grid">
        {data.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
