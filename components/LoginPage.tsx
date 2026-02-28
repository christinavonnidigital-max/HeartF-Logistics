import React, { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { hasNeonAuthConfig } from "../src/lib/neonAuth";
import { Button, Input, Label, ShellCard, StatusPill } from "./UiKit";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function friendlyAuthError(err: unknown): string {
  const msg = String((err as any)?.message || err || "").trim();
  if (!msg) return "Something went wrong. Please try again.";
  if (msg.toLowerCase().includes("invalid")) return "Invalid email or password.";
  if (msg.toLowerCase().includes("password")) return msg;
  if (msg.toLowerCase().includes("email")) return msg;
  return msg;
}

const LoginPage: React.FC = () => {
  const { loading, login, requestPasswordReset, signUp } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInEmail, setSignInEmail] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canSubmitSignIn = useMemo(() => {
    return isValidEmail(signInEmail) && password.length >= 1 && !busy;
  }, [signInEmail, password, busy]);

  const canSubmitSignUp = useMemo(() => {
    return (
      isValidEmail(signUpEmail) &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      password.length >= 6 &&
      password === confirmPassword &&
      !busy
    );
  }, [signUpEmail, firstName, lastName, password, confirmPassword, busy]);

  const resetErrors = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const onSubmitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (!isValidEmail(signInEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setBusy(true);
    try {
      const result = await login(signInEmail.trim(), password);
      if (result === "missing_auth_config") {
        setError("Workspace auth is not configured on this deployment. Only local demo accounts work until Vercel has VITE_NEON_AUTH_URL.");
      } else if (result !== "ok") {
        setError("Login failed. Check that the email/password exists in Neon Auth and that the same email has an approved internal role in Settings -> User management.");
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const onSubmitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();
    if (!isValidEmail(signUpEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const result = await signUp({
        email: signUpEmail.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      if (result !== "ok") {
        setError("Unable to create account. Try again.");
      } else {
        setSuccessMessage("Account created. An admin will assign your role shortly.");
        setSignInEmail(signUpEmail.trim());
        setMode("signin");
      }
    } catch {
      setError("Unable to create account. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const onForgotPassword = async () => {
    resetErrors();
    const e = signInEmail.trim();

    if (!isValidEmail(e)) {
      setError('Enter your email above first, then click "Forgot password?"');
      return;
    }

    setBusy(true);
    try {
      const result = await requestPasswordReset(e, window.location.origin);
      if (result !== "ok") {
        setError("Unable to send reset link. Check the email and try again.");
      } else {
        setError("Reset link sent. Check your email.");
      }
    } catch {
      setError("Unable to send reset link. Check the email and try again.");
    } finally {
      setBusy(false);
    }
  };

  const srTitle = mode === "signin" ? "Heartfledge Logistics - Sign in" : "Heartfledge Logistics - Create account";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1020] text-white">
        <p className="text-sm opacity-80">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-[#0b1020] via-[#121a36] to-[#0b1020]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute -top-24 -right-24 h-[280px] sm:h-[380px] w-[280px] sm:w-[380px] rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-[320px] sm:h-[420px] w-[320px] sm:w-[420px] rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <main className="relative z-10 flex min-h-[100dvh] w-full flex-col lg:flex-row">
        <h1 className="sr-only">{srTitle}</h1>
        <div className="hidden lg:flex w-full lg:w-1/2 flex-col justify-between px-6 sm:px-10 lg:px-16 py-10 lg:py-14 text-white">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-black font-extrabold">
                HF
              </div>
              <div>
                <div className="text-xs tracking-[0.3em] opacity-80">HEARTFLEDGE</div>
                <div className="text-lg font-semibold">Logistics Manager</div>
              </div>
            </div>

            <h1 className="mt-14 text-5xl font-extrabold leading-[1.05]">Run fleets with confidence.</h1>
            <p className="mt-6 max-w-xl text-lg text-white/80 leading-relaxed">
              Dispatch faster, keep customers updated, and know where everything is without jumping across tools.
            </p>

            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <span className="text-xs font-semibold">OK</span>
                </div>
                <div className="text-white/85">Live fleet status & maintenance alerts</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <span className="text-xs font-semibold">OK</span>
                </div>
                <div className="text-white/85">CRM built for logistics buyers</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <span className="text-xs font-semibold">OK</span>
                </div>
                <div className="text-white/85">Real-time routes and proof of delivery</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/60">Trusted by teams moving freight across Southern Africa.</div>
        </div>

        <div className="flex w-full items-center justify-center px-4 py-8 sm:py-10 lg:w-1/2">
          <ShellCard className="w-full max-w-md p-6 md:p-8 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-[0.25em] text-muted-foreground">
                  {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
                </div>
                <div className="mt-1 text-2xl font-bold text-foreground">
                  {mode === "signin" ? "Internal access" : "Request access"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {mode === "signin"
                    ? "Sign in to your workspace."
                    : "Create an internal account. An admin will approve and assign your role."}
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/15">
                <span className="text-sm font-bold text-orange-600">HF</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div>Demo credentials: admin@heartfledge.local / admin123</div>
            </div>
            {!hasNeonAuthConfig ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Workspace auth is not configured on this deployment.
                <div className="mt-1">
                  Set <code>VITE_NEON_AUTH_URL</code> in Vercel project environment variables and redeploy.
                </div>
                <div className="mt-1">
                  The user directory below only maps emails to roles. It does not create password logins.
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-muted/40 p-1 text-xs">
              <button
                type="button"
                className={`flex-1 rounded-xl px-3 py-2 font-semibold transition ${
                  mode === "signin" ? "bg-white text-slate-900 shadow" : "text-muted-foreground"
                }`}
                onClick={() => {
                  setMode("signin");
                  resetErrors();
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl px-3 py-2 font-semibold transition ${
                  mode === "signup" ? "bg-white text-slate-900 shadow" : "text-muted-foreground"
                }`}
                onClick={() => {
                  setMode("signup");
                  resetErrors();
                }}
              >
                Create account
              </button>
            </div>

            {successMessage ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700">
                <div className="font-semibold uppercase tracking-[0.2em]">Pending approval</div>
                <div className="mt-1 text-emerald-700/80">
                  {successMessage}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-4">
                <StatusPill tone="warn" label={error} />
              </div>
            ) : null}

            {mode === "signin" ? (
              <form className="mt-6 space-y-4" onSubmit={onSubmitSignIn} autoComplete="off">
                <input
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden="true"
                  name="name"
                  autoComplete="name"
                />
                <input
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden="true"
                  name="family_name"
                  autoComplete="family-name"
                />
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="section-signin email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    onFocus={resetErrors}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="signin-password">Password</Label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                      onClick={onForgotPassword}
                      disabled={busy}
                    >
                      Forgot your password?
                    </button>
                  </div>

                  <Input
                    id="signin-password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    type="password"
                    autoComplete="section-signin current-password"
                    onFocus={resetErrors}
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full" disabled={!canSubmitSignIn}>
                  {busy ? "Signing in..." : "Login"}
                </Button>
              </form>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={onSubmitSignUp} autoComplete="off">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="signup-first-name">First name</Label>
                    <Input
                      id="signup-first-name"
                      name="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      autoComplete="given-name"
                      onFocus={resetErrors}
                    />
                  </div>

                  <div>
                    <Label htmlFor="signup-last-name">Last name</Label>
                    <Input
                      id="signup-last-name"
                      name="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      autoComplete="family-name"
                      onFocus={resetErrors}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="section-signup email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    onFocus={resetErrors}
                  />
                </div>

                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    type="password"
                    autoComplete="section-signup new-password"
                    onFocus={resetErrors}
                  />
                </div>

                <div>
                  <Label htmlFor="signup-confirm-password">Confirm password</Label>
                  <Input
                    id="signup-confirm-password"
                    name="new-password-confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    type="password"
                    autoComplete="section-signup new-password"
                    onFocus={resetErrors}
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full" disabled={!canSubmitSignUp}>
                  {busy ? "Creating account..." : "Create account"}
                </Button>
              </form>
            )}
          </ShellCard>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
