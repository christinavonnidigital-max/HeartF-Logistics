
import React, { useState } from "react";
import { SignInForm, SignUpForm } from "@neondatabase/auth/react/ui";
import { useAuth } from "../auth/AuthContext";

const LoginPage: React.FC = () => {
  const { loading } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#202A56] text-white">
        <p className="text-sm">Loading Heartfledge workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Brand & Hero */}
      <div role="region" aria-label="Marketing features" className="hidden lg:flex lg:w-1/2 relative bg-linear-to-br from-[#1a2142] via-[#202A56] to-[#273465] overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <img
            src="/heartfledge-logo.svg"
            alt="Heartfledge"
            className="h-12 object-contain mb-8 brightness-0 invert"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Welcome to<br />Heartfledge<br />Logistics Manager
          </h1>
          <p className="text-xl text-slate-200 leading-relaxed max-w-md">
            Streamline your fleet operations, manage routes efficiently, and keep your logistics running smoothly.
          </p>

          {/* Feature Pills */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-slate-200">Real-time fleet tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-slate-200">Intelligent route optimization</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-slate-200">Comprehensive CRM tools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <main role="main" aria-label="Login" className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img
              src="/heartfledge-logo.svg"
              alt="Heartfledge"
              className="h-12 object-contain mb-3"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <h1 className="text-2xl font-bold text-slate-900">Heartfledge Logistics</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {mode === "sign-in" ? "Sign in" : "Create account"}
              </h2>
              <p className="text-sm text-slate-500">
                {mode === "sign-in"
                  ? "Access your logistics workspace"
                  : "Join your logistics workspace"}
              </p>
            </div>

            <div className="space-y-6">
              {mode === "sign-in" ? <SignInForm /> : <SignUpForm />}

              <button
                type="button"
                onClick={() =>
                  setMode((prev) => (prev === "sign-in" ? "sign-up" : "sign-in"))
                }
                className="w-full text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                {mode === "sign-in"
                  ? "New here? Create an account"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
