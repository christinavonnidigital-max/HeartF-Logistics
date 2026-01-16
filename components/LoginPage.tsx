import React, { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { authClient } from "../src/lib/neonAuth";
import { Button, Input, Label, ShellCard, StatusPill } from "./UiKit";

type Mode = "sign-in" | "sign-up";

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
  const { loading, login, refresh } = useAuth();

  const [mode, setMode] = useState<Mode>("sign-in");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmitSignIn = useMemo(() => {
    return isValidEmail(email) && password.length >= 1 && !busy;
  }, [email, password, busy]);

  const canSubmitSignUp = useMemo(() => {
    return (
      isValidEmail(email) &&
      firstName.trim().length >= 1 &&
      lastName.trim().length >= 1 &&
      password.length >= 8 &&
      password === confirmPassword &&
      !busy
    );
  }, [email, firstName, lastName, password, confirmPassword, busy]);

  const resetErrors = () => setError(null);

  const onSubmitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setBusy(true);
    try {
      const result = await login(email.trim(), password);
      if (result !== "ok") {
        setError("Invalid email or password.");
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

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await (authClient as any).signUp.email({
        email: email.trim(),
        password,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      });

      await refresh();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const onForgotPassword = async () => {
    resetErrors();
    const e = email.trim();

    if (!isValidEmail(e)) {
      setError("Enter your email above first, then click “Forgot password?”");
      return;
    }

    setBusy(true);
    try {
      const clientAny = authClient as any;

      if (typeof clientAny.requestPasswordReset === "function") {
        await clientAny.requestPasswordReset({ email: e });
        setError(null);
        alert("If that email exists, a reset message has been sent.");
        return;
      }

      if (clientAny.requestPasswordReset?.email) {
        await clientAny.requestPasswordReset.email({ email: e });
        setError(null);
        alert("If that email exists, a reset message has been sent.");
        return;
      }

      if (clientAny.forgetPassword?.emailOtp) {
        await clientAny.forgetPassword.emailOtp({ email: e });
        setError(null);
        alert("If that email exists, a reset code/link has been sent.");
        return;
      }

      setError(
        "Password reset isn’t enabled in this app yet. Ask an admin to reset your password."
      );
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1020] text-white">
        <p className="text-sm opacity-80">Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1020] via-[#121a36] to-[#0b1020]" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-24 -right-24 h-[380px] w-[380px] rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <main className="relative z-10 flex min-h-screen">
        <div className="hidden w-1/2 flex-col justify-between px-16 py-14 text-white lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-black font-extrabold">
                HF
              </div>
              <div>
                <div className="text-xs tracking-[0.3em] opacity-80">
                  HEARTFLEDGE
                </div>
                <div className="text-lg font-semibold">
                  Logistics Manager
                </div>
              </div>
            </div>

            <h1 className="mt-14 text-5xl font-extrabold leading-[1.05]">
              Run fleets with confidence.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80 leading-relaxed">
              Dispatch faster, keep customers updated, and know where everything is—without
              jumping across tools.
            </p>

            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <span className="text-sm">✓</span>
                </div>
                <div className="text-white/85">
                  Live fleet status & maintenance alerts
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <span className="text-sm">✓</span>
                </div>
                <div className="text-white/85">CRM built for logistics buyers</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <span className="text-sm">✓</span>
                </div>
                <div className="text-white/85">
                  Real-time routes and proof of delivery
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/60">
            Trusted by teams moving freight across Southern Africa.
          </div>
        </div>

        <div className="flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
          <ShellCard className="w-full max-w-md p-6 md:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-[0.25em] text-muted-foreground">
                  SIGN IN
                </div>
                <div className="mt-1 text-2xl font-bold text-foreground">
                  {mode === "sign-in" ? "Welcome back" : "Create your account"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {mode === "sign-in"
                    ? "Use your workspace credentials to continue."
                    : "Create an account to access your logistics workspace."}
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/15">
                <span className="text-sm font-bold text-orange-600">HF</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
              <button
                type="button"
                className={
                  "h-10 rounded-xl text-sm font-semibold transition " +
                  (mode === "sign-in"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
                onClick={() => {
                  setMode("sign-in");
                  resetErrors();
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={
                  "h-10 rounded-xl text-sm font-semibold transition " +
                  (mode === "sign-up"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
                onClick={() => {
                  setMode("sign-up");
                  resetErrors();
                }}
              >
                Sign up
              </button>
            </div>

            {error ? (
              <div className="mt-4">
                <StatusPill tone="warn" label={error} />
              </div>
            ) : null}

            {mode === "sign-in" ? (
              <form className="mt-6 space-y-4" onSubmit={onSubmitSignIn}>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                    inputMode="email"
                    onFocus={resetErrors}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <Label>Password</Label>
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                    onFocus={resetErrors}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={!canSubmitSignIn}
                >
                  {busy ? "Signing in…" : "Login"}
                </Button>

                <div className="pt-2 text-center text-xs text-muted-foreground">
                  Need access?{" "}
                  <button
                    type="button"
                    className="font-semibold text-brand-600 hover:text-brand-700"
                    onClick={() => setMode("sign-up")}
                    disabled={busy}
                  >
                    Create an account
                  </button>
                </div>
              </form>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={onSubmitSignUp}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First name</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Christina"
                      autoComplete="given-name"
                      onFocus={resetErrors}
                    />
                  </div>
                  <div>
                    <Label>Last name</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Gumpo"
                      autoComplete="family-name"
                      onFocus={resetErrors}
                    />
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                    inputMode="email"
                    onFocus={resetErrors}
                  />
                </div>

                <div>
                  <Label>Password</Label>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    type="password"
                    autoComplete="new-password"
                    onFocus={resetErrors}
                  />
                </div>

                <div>
                  <Label>Confirm password</Label>
                  <Input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    type="password"
                    autoComplete="new-password"
                    onFocus={resetErrors}
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    Password must be at least 8 characters.
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={!canSubmitSignUp}
                >
                  {busy ? "Creating account…" : "Create account"}
                </Button>

                <div className="pt-2 text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="font-semibold text-brand-600 hover:text-brand-700"
                    onClick={() => setMode("sign-in")}
                    disabled={busy}
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )}
          </ShellCard>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
