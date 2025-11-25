
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type UserRole = "dispatcher" | "ops_manager" | "finance" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type InternalUserRecord = User & { password: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<"ok" | "invalid">;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "hf_current_user";

// demo users
const DEMO_USERS: InternalUserRecord[] = [
  {
    id: "u1",
    name: "Dispatch Desk",
    email: "dispatcher@heartfledge.local",
    password: "fleet123",
    role: "dispatcher",
  },
  {
    id: "u2",
    name: "Ops Manager",
    email: "ops@heartfledge.local",
    password: "routes123",
    role: "ops_manager",
  },
    {
    id: "u3",
    name: "Finance Desk",
    email: "finance@heartfledge.local",
    password: "money123",
    role: "finance",
  },
  {
    id: "u4",
    name: "Admin",
    email: "admin@heartfledge.local",
    password: "admin123",
    role: "admin",
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // load from localStorage on first render
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const record = DEMO_USERS.find(
        (u) =>
          u.email.toLowerCase() === email.trim().toLowerCase() &&
          u.password === password
      );

      if (!record) {
        return "invalid";
      }

      const safeUser: User = {
        id: record.id,
        name: record.name,
        email: record.email,
        role: record.role,
      };

      setUser(safeUser);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
      } catch {
        // ignore
      }

      return "ok";
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
};
