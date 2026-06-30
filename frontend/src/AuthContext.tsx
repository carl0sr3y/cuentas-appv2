import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Notification {
  message: string;
  time: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  notifications: Notification[];
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket("wss://cuentas-appv2-production.up.railway.app/ws");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications((prev) => [
        { message: data.message, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9)
      ]);

      if (Notification.permission === "granted") {
        new Notification("Cuentas App", { body: data.message });
      }

      window.dispatchEvent(new Event("data-updated"));
    };

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => ws.close();
  }, [token]);

  const login = (token: string, user: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, notifications, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};