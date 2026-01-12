import React, { useMemo, useState } from "react";
import { authClient } from "../src/lib/neonAuth";

const parseQuery = () => {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
};

const AcceptInvitePage: React.FC = () => {
  const query = useMemo(() => parseQuery(), []);
  const token = query.get("token") || "";
  const emailFromLink = query.get("email") || "";

  const [email, setEmail] = useState(emailFromLink);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    token.length >= 10 &&
    email.includes("@") &&
    firstName.trim().length >= 1 &&
    lastName.trim().length >= 1 &&
    password.length >= 8 &&
    password === confirm;

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError("Please complete all fields. Passwords must match and be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/invites-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          email,
          firstName,
          lastName,
          password,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.error) {
        setError(data?.error || "Invite acceptance failed.");
        return;
      }

      try {
        await authClient.signUp.email({
          email,
          password,
          name: `${firstName} ${lastName}`.trim(),
        });
      } catch {
        try {
          await authClient.signIn.email({ email, password });
        } catch (signInError: any) {
          setError(signInError?.message || "Invite accepted, but sign-in failed.");
          return;
        }
      }

      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-xl font-bold">Invalid invite link</h1>
        <p className="text-sm text-slate-600 mt-2">
          This invite link is missing a token. Ask an admin to resend the invite.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900">Accept invite</h1>
        <p className="text-sm text-slate-600 mt-1">Create your account to join the team.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="name@company.com"
              autoComplete="email"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoComplete="family-name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full h-11 rounded-lg bg-orange-600 text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-orange-700 transition"
          >
            {loading ? "Creating account..." : "Accept invite"}
          </button>

          <div className="text-xs text-slate-500">
            Tip: If this link expired, ask an admin to resend it.
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvitePage;
