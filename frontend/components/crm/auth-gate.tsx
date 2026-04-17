"use client";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { CircleAlert, LockKeyhole, ShieldCheck } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { allowedAdminEmails, auth, isFirebaseConfigured } from "@/lib/firebase";

type SessionState = {
  displayName: string;
  displayEmail: string;
};

type AuthGateProps = {
  children: (session: SessionState) => ReactNode;
};

async function userHasAdminAccess(user: User) {
  const tokenResult = await user.getIdTokenResult();
  const email = user.email?.toLowerCase() ?? "";

  return (
    tokenResult.claims.admin === true ||
    (allowedAdminEmails.length > 0 && allowedAdminEmails.includes(email))
  );
}

export function AuthGate({ children }: AuthGateProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [authState, setAuthState] = useState<
    | { status: "loading" }
    | { status: "unconfigured" }
    | { status: "signed-out" }
    | { status: "denied"; user: User | null }
    | { status: "ready"; session: SessionState }
  >({ status: "loading" });

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthState({ status: "unconfigured" });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthState({ status: "signed-out" });
        return;
      }

      const isAdmin = await userHasAdminAccess(user);

      if (!isAdmin) {
        setAuthState({ status: "denied", user });
        return;
      }

      setAuthState({
        status: "ready",
        session: {
          displayName: user.displayName || "Admin",
          displayEmail: user.email || "admin@invoaura.com",
        },
      });
    });

    return () => unsubscribe();
  }, []);

  if (authState.status === "ready") {
    return <>{children(authState.session)}</>;
  }

  if (authState.status === "unconfigured") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="surface-card max-w-lg rounded-[32px] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-amber-500/12 text-amber-600 dark:text-amber-400">
            <CircleAlert className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-[var(--text-primary)]">
            Firebase is not configured
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            This app only shows your live leads. Set{" "}
            <code className="mx-1 rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">
              NEXT_PUBLIC_FIREBASE_*
            </code>{" "}
            in <code className="mx-1 rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">.env.local</code>{" "}
            from the Firebase console, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (authState.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="surface-card max-w-md rounded-[32px] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--accent-soft)] text-[var(--accent)]">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-[var(--text-primary)]">
            Preparing secure workspace
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            Checking your Firebase admin session and warming up the live leads
            environment.
          </p>
        </div>
      </div>
    );
  }

  if (authState.status === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="surface-card max-w-lg rounded-[32px] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-rose-500/12 text-rose-500">
            <LockKeyhole className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-[var(--text-primary)]">
            Admin access required
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            This CRM is locked to accounts with the Firebase custom claim
            `admin: true` or an allowed admin email in your environment config.
          </p>
          <button
            type="button"
            onClick={() => {
              if (authState.user && auth) {
                void signOut(auth);
              }
            }}
            className="mt-6 inline-flex items-center justify-center rounded-[22px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="surface-card-strong grid max-w-5xl gap-0 overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
        <div className="ghost-grid relative overflow-hidden bg-[var(--accent)] p-8 text-white sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.12),_transparent_34%)]" />
          <div className="relative">
            <p className="text-sm uppercase tracking-[0.35em] text-white/70">
              Invoaura CRM
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-balance">
              Courier ops, lead conversion, and premium client follow-up in one
              admin cockpit.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-8 text-white/80">
              Sign in with your Firebase admin account to manage quotes, watch
              real-time inquiries land, and move hot leads into booked routes.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <p className="soft-pill">Admin sign-in</p>
          <h2 className="mt-5 text-3xl font-semibold text-[var(--text-primary)]">
            Secure dashboard access
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Use the same Firebase Authentication email and password your ops
            team uses for the admin panel.
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setLoginError("");

              if (!auth) {
                return;
              }

              void signInWithEmailAndPassword(auth, email, password).catch(
                (error: Error) => {
                  setLoginError(error.message);
                },
              );
            }}
          >
            <div>
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-[0.24em] text-muted"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-[22px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                placeholder="ops@invoaura.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-[0.24em] text-muted"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-[22px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                placeholder="Enter your password"
              />
            </div>

            {loginError ? (
              <div className="rounded-[22px] bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
                {loginError}
              </div>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-[22px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              Enter admin workspace
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
