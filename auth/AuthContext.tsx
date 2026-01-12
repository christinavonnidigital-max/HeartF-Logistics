import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authClient } from "../src/lib/neonAuth";

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

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<"ok" | "invalid">;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return data?.user || null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const session = authClient.useSession();

  const refresh = useCallback(async () => {
    const me = await exchangeSession();
    setUser(me);
  }, []);

  useEffect(() => {
    if (session.isPending) return;
    let active = true;

    (async () => {
      try {
        if (!session.data) {
          if (active) setUser(null);
          return;
        }
        const me = await exchangeSession();
        if (active) setUser(me);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [session.isPending, session.data]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await authClient.signIn.email({ email, password });
        await refresh();
        return "ok";
      } catch {
        return "invalid";
      }
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    try {
      await authClient.signOut();
      await fetch("/.netlify/functions/auth-logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const IDLE_TIMEOUT = 30 * 60 * 1000;
    let timeoutId: number;

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        logout();
        alert("You were logged out due to inactivity.");
      }, IDLE_TIMEOUT);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((e) => document.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((e) => document.removeEventListener(e, resetTimer));
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
