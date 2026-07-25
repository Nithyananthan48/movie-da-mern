import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../api";

export function AdminLoginPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const data = await adminApi.login(email, password);
      localStorage.setItem("admin_token", data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="stack">
      <section className="hero">
        <h1>Admin Login</h1>
        <p>Secure access for managing movies and source ratings.</p>
      </section>
      <form onSubmit={onSubmit} className="card form-grid">
        <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
        <button className="btn" type="submit">
          Sign in
        </button>
        {error ? <p>{error}</p> : null}
      </form>
    </div>
  );
}
