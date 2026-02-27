import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

const authUrl = (import.meta as any).env?.VITE_NEON_AUTH_URL;
export const hasNeonAuthConfig = Boolean(authUrl);

type MinimalAuthClient = {
  getSession: () => Promise<{ data: null }>;
  signOut: () => Promise<void>;
  signIn: { email: (args: any) => Promise<any> };
  signUp: { email: (args: any) => Promise<any> };
  requestPasswordReset: (args: any) => Promise<any>;
};

const fallbackAuthClient: MinimalAuthClient = {
  getSession: async () => ({ data: null }),
  signOut: async () => {},
  signIn: {
    email: async () => {
      throw new Error("Neon auth disabled: missing VITE_NEON_AUTH_URL");
    },
  },
  signUp: {
    email: async () => {
      throw new Error("Neon auth disabled: missing VITE_NEON_AUTH_URL");
    },
  },
  requestPasswordReset: async () => {
    throw new Error("Neon auth disabled: missing VITE_NEON_AUTH_URL");
  },
};

if (!hasNeonAuthConfig) {
  console.warn("[Auth] Missing VITE_NEON_AUTH_URL. Running with fallback auth client.");
}

export const authClient: any = hasNeonAuthConfig
  ? createAuthClient(authUrl, {
      adapter: BetterAuthReactAdapter(),
    })
  : fallbackAuthClient;
