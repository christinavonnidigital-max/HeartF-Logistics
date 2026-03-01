// Auth context (Netlify-free) using Neon Auth directly
// - Uses @neondatabase/auth for hosted auth flows
// - Falls back to dev demo users for offline testing

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { authClient } from "../src/lib/neonAuth";
import { hasNeonAuthConfig } from "../src/lib/neonAuth";
import { apiFetch } from "../src/services/apiClient";
import { usersApi } from "../src/services/dbApi";

export type UserRole =
  | "dispatcher"
  | "ops_manager"
  | "finance"
  | "admin"
  | "customer"
  | "driver"
  | "pending";

export type User = {
  userId: string;
  orgId: string;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
};

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  loading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<"ok" | "invalid" | "missing_auth_config" | "directory_unavailable">;
  signUp: (
    payload: { email: string; password: string; firstName: string; lastName: string }
  ) => Promise<"ok" | "invalid" | "directory_unavailable">;
  requestPasswordReset: (email: string, redirectTo?: string) => Promise<"ok" | "invalid">;
  logout: () => Promise<void>;
  refresh: () => Promise<"authenticated" | "unauthenticated" | "directory_unavailable">;

  authFetch: <T>(
    url: string,
    init?: Omit<Parameters<typeof apiFetch<T>>[1], "onUnauthorized">
  ) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEV_TEST_USERS: Record<
  string,
  { password: string; role: UserRole; firstName: string; lastName: string }
> = {
  "admin@heartfledge.local": {
    password: "admin123",
    role: "admin",
    firstName: "Admin",
    lastName: "User",
  },
  "dispatcher@heartfledge.local": {
    password: "fleet123",
    role: "dispatcher",
    firstName: "Dispatch",
    lastName: "User",
  },
  "ops@heartfledge.local": {
    password: "routes123",
    role: "ops_manager",
    firstName: "Ops",
    lastName: "Manager",
  },
  "finance@heartfledge.local": {
    password: "finance123",
    role: "finance",
    firstName: "Finance",
    lastName: "User",
  },
  "driver@heartfledge.local": {
    password: "driver123",
    role: "driver",
    firstName: "Driver",
    lastName: "User",
  },
};

function splitName(name?: string | null) {
  const trimmed = (name || "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
}

function mapSessionToUser(session: any): User | null {
  const email =
    (session?.user?.email as string | undefined) ||
    (session?.session?.user?.email as string | undefined) ||
    "";
  if (!email) return null;
  const name =
    (session?.user?.name as string | undefined) ||
    (session?.session?.user?.name as string | undefined) ||
    "";
  const { firstName, lastName } = splitName(name || email.split("@")[0]);

  return {
    userId: session?.user?.id || email,
    orgId: "neon-auth",
    role: "pending",
    email,
    firstName: firstName || "User",
    lastName: lastName,
  };
}

function devUserForCredentials(email: string, password?: string): User | null {
  const normalized = email.toLowerCase().trim();
  const entry = DEV_TEST_USERS[normalized];
  if (!entry) return null;
  if (password && entry.password !== password) return null;
  return {
    userId: normalized,
    orgId: "local",
    role: entry.role,
    email: normalized,
    firstName: entry.firstName,
    lastName: entry.lastName,
  };
}

async function ensureUserRecord(email: string, role: UserRole = "pending", firstName?: string, lastName?: string) {
  const existing = await usersApi.getByEmail(email);
  if (existing) return existing;
  return usersApi.create({
    email,
    role,
    firstName,
    lastName,
    isActive: true,
    emailVerified: false,
  });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");

  const refreshInFlight = useRef<Promise<"authenticated" | "unauthenticated" | "directory_unavailable"> | null>(null);

  const logout = useCallback(async () => {
    try {
      await authClient.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refresh = useCallback(async (): Promise<"authenticated" | "unauthenticated" | "directory_unavailable"> => {
    if (refreshInFlight.current) {
      return refreshInFlight.current;
    }

    const p = (async (): Promise<"authenticated" | "unauthenticated" | "directory_unavailable"> => {
      setStatus("checking");
      try {
        const session = await authClient.getSession();
        const base = mapSessionToUser(session?.data);
        if (!base || base.role === "customer") {
          setUser(null);
          setStatus("unauthenticated");
          return "unauthenticated";
        }
        const record = await ensureUserRecord(base.email, base.role, base.firstName, base.lastName);
        const role: UserRole = (record?.role as UserRole) || base.role || "pending";
        const userObj: User = {
          ...base,
          role,
          firstName: record?.firstName || base.firstName,
          lastName: record?.lastName || base.lastName,
          userId: record?.id ? String(record.id) : base.userId,
        };
        if (role === "customer") {
          setUser(null);
          setStatus("unauthenticated");
          return "unauthenticated";
        }
        setUser(userObj);
        setStatus("authenticated");
        return "authenticated";
      } catch (error: any) {
        const message = String(error?.message || error || "").toLowerCase();
        const isDirectoryFailure =
          message.includes("timed out") ||
          message.includes("database error") ||
          message.includes("api error") ||
          message.includes("fetch");

        if (isDirectoryFailure) {
          try {
            await authClient.signOut();
          } catch {
            // ignore
          }
          setUser(null);
          setStatus("unauthenticated");
          return "directory_unavailable";
        }
        setUser(null);
        setStatus("unauthenticated");
        return "unauthenticated";
      }
    })();

    refreshInFlight.current = p;
    try {
      return await p;
    } finally {
      refreshInFlight.current = null;
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setStatus("checking");
      try {
        const devUser = devUserForCredentials(email, password);
        if (devUser) {
          if (devUser.role === "customer") throw new Error("customer_not_allowed");
          setUser(devUser);
          setStatus("authenticated");
          return "ok";
        }

        if (!hasNeonAuthConfig) {
          setUser(null);
          setStatus("unauthenticated");
          return "missing_auth_config";
        }

        await authClient.signIn.email({ email, password });
        const refreshResult = await refresh();
        if (refreshResult === "authenticated") return "ok";
        if (refreshResult === "directory_unavailable") return "directory_unavailable";
        return "invalid";
      } catch (err: any) {
        setUser(null);
        setStatus("unauthenticated");
        return "invalid";
      }
    },
    [refresh]
  );

  const signUp = useCallback(
    async ({ email, password, firstName, lastName }: { email: string; password: string; firstName: string; lastName: string }) => {
      setStatus("checking");
      try {
        await authClient.signUp.email({
          email,
          password,
          name: `${firstName} ${lastName}`.trim(),
        });
        await ensureUserRecord(email, "pending", firstName, lastName);
        const refreshResult = await refresh();
        if (refreshResult === "directory_unavailable") return "directory_unavailable";
        return "ok";
      } catch {
        setUser(null);
        setStatus("unauthenticated");
        return "invalid";
      }
    },
    [refresh]
  );

  const requestPasswordReset = useCallback(async (email: string, redirectTo?: string) => {
    setStatus("checking");
    try {
      await authClient.requestPasswordReset({
        email,
        ...(redirectTo ? { redirectTo } : {}),
      } as any);
      setStatus(user ? "authenticated" : "unauthenticated");
      return "ok";
    } catch {
      setStatus(user ? "authenticated" : "unauthenticated");
      return "invalid";
    }
  }, [user]);

  // Initial restore
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Idle logout (30 minutes)
  useEffect(() => {
    if (!user) return;

    const IDLE_TIMEOUT = 30 * 60 * 1000;
    let timeoutId: number | undefined;

    const resetTimer = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(async () => {
        await logout();
        window.setTimeout(() => {
          alert("You were logged out due to inactivity.");
        }, 0);
      }, IDLE_TIMEOUT);
    };

    const events: Array<keyof DocumentEventMap> = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((e) => document.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      events.forEach((e) => document.removeEventListener(e, resetTimer));
    };
  }, [user, logout]);

  const authFetch = useCallback(
    async <T,>(
      url: string,
      init?: Omit<Parameters<typeof apiFetch<T>>[1], "onUnauthorized">
    ) => {
      return apiFetch<T>(url, {
        ...(init ?? {}),
        onUnauthorized: logout,
      });
    },
    [logout]
  );

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      status,
      loading: status === "checking",
      login,
      signUp,
      requestPasswordReset,
      logout,
      refresh,
      authFetch,
    };
  }, [user, status, login, signUp, requestPasswordReset, logout, refresh, authFetch]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
