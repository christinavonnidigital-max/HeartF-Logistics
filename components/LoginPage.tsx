
import React, { useState } from "react";
import { SignInForm, SignUpForm } from "@neondatabase/auth/react/ui";
import { useAuth } from "../auth/AuthContext";

const LoginPage: React.FC = () => {
  const { loading } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-foreground">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="h-6 w-6 rounded-full border-2 border-border border-t-transparent animate-spin" aria-hidden="true" />
          <div className="text-left">
            <p className="text-sm font-semibold">Loading…</p>
            <p className="text-xs text-muted-foreground">Preparing your workspace</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--app-bg)] text-foreground">
      {/* Left Side - Brand & Proof */}
      <aside
        role="region"
        aria-label="Heartfledge brand"
        className="hidden lg:flex lg:w-5/12 flex-col justify-between bg-[#1e2b57] text-white p-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-orange-500/10 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#f5993b] text-[#1e2b57] font-extrabold text-lg flex items-center justify-center shadow-lg">
              HF
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/70">Heartfledge</div>
              <div className="text-xl font-semibold">Logistics Manager</div>
            </div>
          </div>

          <h1 className="mt-10 text-4xl font-bold leading-tight">
            Run fleets with confidence.
          </h1>
          <p className="mt-3 text-lg text-white/80 max-w-lg">
            Dispatch faster, keep customers updated, and know where everything is—without jumping across tools.
          </p>

          <div className="mt-10 space-y-3">
            {[
              "Live fleet status & maintenance alerts",
              "CRM built for logistics buyers",
              "Real-time routes and proof of delivery",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white">
                  ✓
                </span>
                <span className="text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/60">
          Trusted by teams moving freight across Southern Africa.
        </div>
      </aside>

      {/* Right Side - Login Form */}
      <main
        role="main"
        aria-label="Login"
        className="flex-1 flex items-center justify-center px-6 py-10 lg:px-14"
      >
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[#f5993b] text-[#1e2b57] font-bold flex items-center justify-center">
              HF
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Heartfledge Logistics</p>
              <p className="text-xs text-muted-foreground">Fleet and CRM platform</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-lg shadow-black/5">
            <div className="border-b border-border px-6 py-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sign in</p>
              <h2 className="text-xl font-semibold text-foreground mt-1">
                Welcome back
              </h2>
              <p className="text-sm text-muted-foreground">
                Use your workspace credentials to continue.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {mode === "sign-in" ? <SignInForm /> : <SignUpForm />}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Need access?</span>
                <button
                  type="button"
                  onClick={() => setMode((prev) => (prev === "sign-in" ? "sign-up" : "sign-in"))}
                  className="text-[#1e2b57] font-semibold hover:text-[#f5993b] transition"
                >
                  {mode === "sign-in" ? "Create an account" : "Already have an account?"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
