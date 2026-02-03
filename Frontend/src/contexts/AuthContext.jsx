// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../api/supabaseClient";

const TOKEN_KEY = "pinpoint_JWT";
const AuthContext = createContext(null);

/**
 * Provides application-wide authentication state using Supabase.
 *
 * Restores an existing session on app load, listens for Supabase auth
 * state changes (login, logout, token refresh), and exposes the current
 * user, JWT token, and login/logout helpers via React context.
 */
export const AuthProvider = ({ children }) => {
  // initialize from localStorage so refresh doesn't flash logged-out
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);

  const isUserLoggedIn = !!token;

  // On mount: restore Supabase session (if it exists)
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        // if session retrieval fails, clear everything
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        return;
      }

      const session = data?.session ?? null;
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);

      if (session?.access_token) {
        localStorage.setItem(TOKEN_KEY, session.access_token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    });

    // Keep state in sync when Supabase refreshes token / logs in / logs out
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);

      if (session?.access_token) {
        localStorage.setItem(TOKEN_KEY, session.access_token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    });

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Login via Supabase (no userData param)
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const session = data?.session ?? null;

    // These sets are redundant with onAuthStateChange, but make UI update immediately
    setUser(session?.user ?? null);
    setToken(session?.access_token ?? null);

    if (session?.access_token) {
      localStorage.setItem(TOKEN_KEY, session.access_token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }

    return data; 
  };

  const logout = async () => {
    await supabase.auth.signOut();

    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  // optional convenience: headers for calling your FastAPI with JWT
  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const value = useMemo(
    () => ({ user, token, isUserLoggedIn, authHeaders, login, logout }),
    [user, token, isUserLoggedIn, authHeaders]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
