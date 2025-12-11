
import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";

const DEMO_ACCOUNTS = [
  { email: "dispatcher@heartfledge.local", password: "fleet123", role: "Dispatcher" },
  { email: "ops@heartfledge.local", password: "routes123", role: "Ops Manager" },
  { email: "finance@heartfledge.local", password: "money123", role: "Finance Desk" },
  { email: "admin@heartfledge.local", password: "admin123", role: "Admin" },
  { email: "customer@heartfledge.local", password: "client123", role: "Customer" },
];

const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("dispatcher@heartfledge.local");
  const [password, setPassword] = useState("fleet123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const result = await login(email, password);
    if (result === "invalid") {
      setError("Email or password is incorrect.");
    }

    setSubmitting(false);
  };

  const handleDemoClick = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#202A56] text-white">
        <p className="text-sm">Loading Heartfledge workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#202A56] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-5 flex flex-col items-center gap-2">
          <img
            src="/heartfledge-logo-transparent-navy.png"
            alt="Heartfledge Logistics"
            className="h-10 object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <h1 className="mt-1 text-base font-semibold text-slate-900">
            Heartfledge Logistics Manager
          </h1>
          <p className="text-xs text-slate-500 text-center">
            Sign in with your workspace account to manage fleet, routes and
            bookings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-xs text-gray-500">Demo Accounts</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleDemoClick(acc.email, acc.password)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-left transition hover:border-orange-300 hover:bg-orange-50 hover:shadow-sm group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-700 group-hover:text-orange-800">{acc.role}</p>
                  <p className="text-[10px] text-slate-500">{acc.email}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-orange-600 bg-white px-1.5 py-0.5 rounded border border-slate-100 group-hover:border-orange-200">
                  {acc.password}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
