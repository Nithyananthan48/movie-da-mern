import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { movieApi } from "../api";

export function MovieDetailPage() {
  const { id = "" } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ["movie", id], queryFn: () => movieApi.detail(id) });
  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>Movie not found.</p>;

  return (
    <div className="stack">
      <section className="hero">
        <h1>
          {data.title} ({data.year})
        </h1>
        <p>{data.synopsis || "Synopsis not available yet."}</p>
      </section>
      <div className="card">
        <h2 className="section-title">Aggregate: {data.score?.aggregateScore ?? "N/A"}</h2>
      </div>
      <div className="card">
        <h3 className="section-title">Source Ratings</h3>
        <ul>
        {data.ratings.map((rating) => (
          <li key={rating.id}>
            {rating.source.name}: {rating.rawValue} ({rating.normalizedValue.toFixed(1)}/100)
          </li>
        ))}
        </ul>
      </div>
    </div>
  );
}
