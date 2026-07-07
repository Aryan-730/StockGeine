import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { api } from "@/lib/api";
import { User, Business } from "@/types";

interface AuthContextValue {
  user: User | null;
  business: Business | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    businessName: string;
    businessType: string;
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("stockgenie_token")
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("stockgenie_user");
    const storedBusiness = localStorage.getItem("stockgenie_business");
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedBusiness) setBusiness(JSON.parse(storedBusiness));
    setIsLoading(false);
  }, []);

  function persist(newToken: string, newUser: User, newBusiness: Business) {
    localStorage.setItem("stockgenie_token", newToken);
    localStorage.setItem("stockgenie_user", JSON.stringify(newUser));
    localStorage.setItem("stockgenie_business", JSON.stringify(newBusiness));
    setToken(newToken);
    setUser(newUser);
    setBusiness(newBusiness);
  }

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.data.token, data.data.user, data.data.business);
  }

  async function register(payload: {
    businessName: string;
    businessType: string;
    name: string;
    email: string;
    password: string;
  }) {
    const { data } = await api.post("/auth/register", payload);
    persist(data.data.token, data.data.user, data.data.business);
  }

  function logout() {
    localStorage.removeItem("stockgenie_token");
    localStorage.removeItem("stockgenie_user");
    localStorage.removeItem("stockgenie_business");
    setToken(null);
    setUser(null);
    setBusiness(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, business, token, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
