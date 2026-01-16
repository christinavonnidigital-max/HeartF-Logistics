// Part 1: Auth context (Neon Auth + Netlify cookie session)
// Goals:
// - Stable auth lifecycle with explicit status
// - Refresh restores user reliably
// - Expose authFetch() which auto-logs out on 401/403

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
import { apiFetch } from "../src/services/apiClient";

// Part 2: Types
export type UserRole =
  | "dispatcher"
  | "ops_manager"
  | "finance"
  | "admin"
  | "customer"
  | "driver";

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

  login: (email: string, password: string) => Promise<"ok" | "invalid">;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;

  // Shared fetch helper that auto-logs out on 401/403
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
  "customer@heartfledge.local": {
    password: "client123",
    role: "customer",
    firstName: "Customer",
    lastName: "User",
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

// Part 3: Exchange Neon token -> Netlify httpOnly cookie session, and return user
type ExchangeResult = { user: User | null };

async function exchangeSession(): Promise<User | null> {
  const session = await authClient.getSession();
  const token = session.data?.session?.token || null;
  if (!token) return null;

  const res = await fetch("/.netlify/functions/auth-exchange", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  let data: ExchangeResult | null = null;
  try {
    data = (await res.json()) as ExchangeResult;
  } catch {
    data = null;
  }

  if (!res.ok) return null;
  return data?.user ?? null;
}

// Part 4: Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");

  // Neon session hook
  const session = authClient.useSession();

  // Prevent overlapping refresh calls
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const devLoginActiveRef = useRef(false);
  const devUserRef = useRef<User | null>(null);

  const logout = useCallback(async () => {
    devLoginActiveRef.current = false;
    devUserRef.current = null;
    try {
      if (typeof window !== "undefined") {
        (window as any).__hfTestLoginActive = false;
      }
    } catch {
      // ignore
    }

    // Update UI first for safety and responsiveness
    setUser(null);
    setStatus("unauthenticated");

    try {
      await authClient.signOut();
    } catch {
      // ignore
    }

    try {
      await fetch("/.netlify/functions/auth-logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }
  }, []);

  const refresh = useCallback(async () => {
    if (devLoginActiveRef.current) {
      const me = devUserRef.current;
      setUser(me);
      setStatus(me ? "authenticated" : "unauthenticated");
      return;
    }

    if (refreshInFlight.current) {
      await refreshInFlight.current;
      return;
    }

    const p = (async () => {
      setStatus("checking");
      try {
        const me = await exchangeSession();
        devUserRef.current = null;
        setUser(me);
        setStatus(me ? "authenticated" : "unauthenticated");
      } catch {
        devUserRef.current = null;
        setUser(null);
        setStatus("unauthenticated");
      }
    })();

    refreshInFlight.current = p;
    try {
      await p;
    } finally {
      refreshInFlight.current = null;
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      devLoginActiveRef.current = false;
      devUserRef.current = null;
      try {
        if (typeof window !== "undefined") {
          (window as any).__hfTestLoginActive = false;
        }
      } catch {
        // ignore
      }

      setStatus("checking");

      try {
        await authClient.signIn.email({ email, password });
        await refresh();
        return "ok";
      } catch {
        setUser(null);
        setStatus("unauthenticated");
        return "invalid";
      }
    },
    [refresh]
  );

  // Part 5: Initial restore after Neon session resolves
  useEffect(() => {
    if (session.isPending) return;

    let active = true;

    (async () => {
      try {
        setStatus("checking");

        if (devLoginActiveRef.current) {
          const devUser = devUserRef.current;
          if (!active) return;
          setUser(devUser);
          setStatus(devUser ? "authenticated" : "unauthenticated");
          return;
        }

        // No Neon session => unauthenticated
        if (!session.data) {
          if (!active) return;
          setUser(null);
          setStatus("unauthenticated");
          return;
        }

        // Neon session exists => exchange to Netlify cookie session and load user
        const me = await exchangeSession();
        if (!active) return;

        setUser(me);
        setStatus(me ? "authenticated" : "unauthenticated");
      } catch {
        if (!active) return;
        setUser(null);
        setStatus("unauthenticated");
      }
    })();

    return () => {
      active = false;
    };
  }, [session.isPending, session.data]);

  // Part 6: Idle logout (30 minutes)
  useEffect(() => {
    if (!user) return;

    const IDLE_TIMEOUT = 30 * 60 * 1000;
    let timeoutId: number | undefined;

    const resetTimer = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(async () => {
        await logout();
        // Alert after logout so UI state is already consistent
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

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;

    (window as any).__hfTestLogin = (email: string, password?: string) => {
      const me = devUserForCredentials(email, password);
      try {
        (window as any).__hfTestLoginActive = Boolean(me);
      } catch {
        // ignore
      }
      devLoginActiveRef.current = Boolean(me);
      devUserRef.current = me;
      setUser(me);
      setStatus(me ? "authenticated" : "unauthenticated");
      return Boolean(me);
    };

    try {
      (window as any).__hfTestLoginActive = devLoginActiveRef.current;
    } catch {
      // ignore
    }

    return () => {
      try {
        delete (window as any).__hfTestLogin;
        delete (window as any).__hfTestLoginActive;
      } catch {
        // ignore
      }
    };
  }, []);

  // Part 7: authFetch auto-logs out on 401/403
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
      logout,
      refresh,
      authFetch,
    };
  }, [user, status, login, logout, refresh, authFetch]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
