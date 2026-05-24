"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "Login failed.");
      return;
    }

    localStorage.setItem("sgcc_token", data.token);
    localStorage.setItem("sgcc_user", JSON.stringify(data.user));

    if (data.user.role === "admin") {
      router.push("/admin");
      return;
    }

    if (data.user.role === "agent") {
      router.push("/agent");
      return;
    }

    setMessage("No interface is configured for this role.");
  }

  return (
    <main className="login-page">
      <section className="login-left-panel" aria-hidden="true">
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-blob login-blob-3" />
        <div className="login-blob login-blob-4" />
        <div className="login-blob login-blob-5" />
        <div className="login-lines">
          <div className="login-line" />
          <div className="login-line" />
          <div className="login-line" />
          <div className="login-line" />
        </div>
        <div className="login-dot login-dot-1" />
        <div className="login-dot login-dot-2" />
        <div className="login-dot login-dot-3" />
      </section>

      <section className="login-right-panel">
        <form className="login-card" onSubmit={login}>
          <h1 className="login-card-title">
            Connectez-vous à
            <br />
            votre compte
          </h1>
          <p className="login-card-subtitle">
            Bienvenue! Entrez vos identifiants.
          </p>

          {message ? <p className="login-message">{message}</p> : null}

          <div className="login-field">
            <label htmlFor="email">Adresse email</label>
            <div className="login-input-wrap">
              <svg
                aria-hidden="true"
                fill="none"
                height="18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
                width="18"
              >
                <rect height="16" rx="3" width="20" x="2" y="4" />
                <path d="M2 7l10 7 10-7" />
              </svg>
              <input
                autoComplete="email"
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@exemple.com"
                required
                type="email"
                value={email}
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="password">Mot de passe</label>
            <div className="login-input-wrap">
              <svg
                aria-hidden="true"
                fill="none"
                height="18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
                width="18"
              >
                <rect height="11" rx="2" width="18" x="3" y="11" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                autoComplete="current-password"
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                className="login-toggle-pw"
                onClick={() => setShowPassword((current) => !current)}
                title="Afficher/masquer"
                type="button"
              >
                {showPassword ? (
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="18"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                    width="18"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="18"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                    width="18"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" x2="23" y1="1" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="login-options-row">
            <label className="login-checkbox-label">
              <input
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                type="checkbox"
              />
              <span className="login-checkbox-box">
                <svg fill="none" height="9" viewBox="0 0 11 9" width="11">
                  <path
                    d="M1 4.5L4 7.5L10 1"
                    stroke="#1A1A1A"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              Se souvenir de moi
            </label>
            <button className="login-forgot-link" type="button">
              Mot de passe oublié ?
            </button>
          </div>

          <button className="login-submit" type="submit">
            Se connecter
          </button>
        </form>
      </section>
    </main>
  );
}
