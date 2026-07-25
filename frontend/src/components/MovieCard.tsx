import { Link } from "react-router-dom";
import type { Movie } from "../types";

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <div className="card movie-card">
      <h3>{movie.title}</h3>
      <p className="movie-meta">{movie.year}</p>
      <p className="movie-meta">{movie.genres.join(", ") || "No genres yet"}</p>
      <span className="badge">Score: {movie.score?.aggregateScore ?? "N/A"}</span>
      <div>
        <Link className="btn" to={`/movies/${movie.id}`}>
          View details
        </Link>
      </div>
    </div>
  );
}
