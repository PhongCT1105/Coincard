import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";

// 1. Define the User type based on your API response
interface User {
  user_id: string;
  username: string;
  balance: number;
}

// 2. Define the context's state and functions
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

// 3. Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Create the Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // To check for a saved session
  const [, setLocation] = useLocation();

  // On initial app load, check localStorage for a saved user
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("coinCardUser");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("coinCardUser"); // Clear corrupted data
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to save user to state and localStorage
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("coinCardUser", JSON.stringify(userData));
  };

  // Function to clear user from state and localStorage
  const logout = () => {
    setUser(null);
    localStorage.removeItem("coinCardUser");
    setLocation("/signin");
  };

  // 5. Pass the values to the context provider
  const value = {user, loading, login, logout,};

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 6. Create the custom hook for easy access
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}