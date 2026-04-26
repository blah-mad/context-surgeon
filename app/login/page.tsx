"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Globe, Mail, Microscope, Moon, Sun } from "lucide-react";
import {
  loadFirebaseAuthConfig,
  readStoredSession,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  storeSession,
  type AuthSession,
  type FirebaseAuthConfig
} from "@/lib/firebase/client-auth";

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        document.documentElement.classList.toggle("dark", next === "dark");
        localStorage.setItem("context-surgeon-theme", next);
        setTheme(next);
      }}
      className="inline-flex size-10 items-center justify-center rounded-2xl border border-border bg-surface text-muted transition hover:border-primary/40 hover:text-fg"
    >
      <Icon className="size-4" />
    </button>
  );
}

export default function LoginPage() {
  const [config, setConfig] = useState<FirebaseAuthConfig>({ configured: false });
  const [session, setSession] = useState<AuthSession | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let ignore = false;
    loadFirebaseAuthConfig()
      .then((next) => {
        if (ignore) return;
        setConfig(next);
        setSession(readStoredSession());
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Auth config failed."))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function complete(nextSession: AuthSession) {
    setSession(nextSession);
    window.location.href = "/demo";
  }

  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="pointer-events-none fixed inset-0 ambient-glow" />
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[18px] bg-code text-primary">
            <Microscope className="size-5" />
          </span>
          <div>
            <p className="font-semibold leading-none">Context Surgeon</p>
            <p className="mt-1 font-mono text-[11px] text-muted">secure workbench access</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/demo" className="hidden rounded-2xl px-3 py-2 text-sm text-muted transition hover:bg-surface hover:text-fg sm:inline-flex">
            Demo
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-92px)] max-w-7xl items-center gap-10 px-6 pb-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
            Big. Hack. Berlin.
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[0.98] max-md:text-4xl">
            Sign in to operate context before agents operate the business.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
            The public demo runs instantly. Signing in unlocks saved workspaces, live source
            connections, approved exports, and a durable audit trail.
          </p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {["Saved workspace", "Live evidence", "Audited export"].map((item) => (
              <div key={item} className="soft-panel border border-border bg-surface/85 p-4">
                <p className="font-semibold">{item}</p>
                <p className="mt-1 text-sm text-muted">ready for review</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel border border-border p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                Account
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {session ? "You are signed in" : mode === "signin" ? "Welcome back" : "Create access"}
              </h2>
            </div>
            {session ? (
              <button
                onClick={() => {
                  storeSession(null);
                  setSession(null);
                }}
                className="rounded-2xl border border-border bg-surface px-3 py-2 text-sm font-semibold"
              >
                Sign out
              </button>
            ) : null}
          </div>

          {loading && !session ? (
            <div className="grid gap-3">
              <div className="h-12 animate-pulse rounded-2xl bg-surface" />
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-surface" />
              <div className="h-12 animate-pulse rounded-2xl bg-surface" />
              <div className="h-12 animate-pulse rounded-2xl bg-surface" />
              <p className="text-sm text-muted">Loading secure access...</p>
            </div>
          ) : session ? (
            <div>
              <p className="text-muted">{session.displayName || session.email}</p>
              <Link
                href="/demo"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 font-semibold text-cream shadow-lg shadow-primary/20"
              >
                Open workbench <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <form
              className="grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                setError(undefined);
                setLoading(true);
                try {
                  const next =
                    mode === "signin"
                      ? await signInWithEmail(config, email, password)
                      : await signUpWithEmail(config, email, password, displayName);
                  await complete(next);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Authentication failed.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <button
                type="button"
                disabled={loading || !config.configured}
                onClick={async () => {
                  setError(undefined);
                  setLoading(true);
                  try {
                    await complete(await signInWithGoogle(config));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Google sign-in failed.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-bg font-semibold transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Globe className="size-4 text-primary" />
                Continue with Google
              </button>

              <div className="flex items-center gap-3 py-2 text-xs text-muted">
                <span className="h-px flex-1 bg-border" />
                or use email
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="flex gap-2">
                {(["signin", "signup"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={`h-10 rounded-2xl px-4 text-sm font-semibold transition ${mode === item ? "bg-primary text-cream" : "border border-border bg-bg text-muted"}`}
                  >
                    {item === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              {mode === "signup" ? (
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Display name"
                  className="h-12 rounded-2xl border border-border bg-bg px-4 outline-none transition focus:border-primary"
                />
              ) : null}
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="h-12 rounded-2xl border border-border bg-bg px-4 outline-none transition focus:border-primary"
              />
              <input
                required
                minLength={6}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="h-12 rounded-2xl border border-border bg-bg px-4 outline-none transition focus:border-primary"
              />
              {error ? <p className="text-sm text-[oklch(0.50_0.18_27)]">{error}</p> : null}
              {!loading && !config.configured ? (
                <p className="text-sm text-[oklch(0.50_0.18_27)]">Sign-in config is not available.</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={loading || !config.configured}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 font-semibold text-cream shadow-lg shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Mail className="size-4" />
                  {mode === "signin" ? "Sign in" : "Create account"}
                </button>
                <button
                  type="button"
                  disabled={loading || !email || !config.configured}
                  onClick={async () => {
                    try {
                      await sendPasswordReset(config, email);
                      setError("Password reset email sent.");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Password reset failed.");
                    }
                  }}
                  className="h-11 rounded-2xl border border-border bg-bg px-4 text-sm font-semibold text-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reset password
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
