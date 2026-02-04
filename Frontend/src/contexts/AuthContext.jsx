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
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);

  const isUserLoggedIn = !!token;

  // session restore
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        return;
      }

      const session = data?.session ?? null;
      const authUser = session?.user ?? null;

      if (authUser) {
        // FETCH custom user data
        const { data: userData } = await supabase
          .from("users")
          .select("profile_pic_url, name")
          .eq("user_id", authUser.id)
          .single();

        // MERGE auth user with custom data
        const fullUser = {
          ...authUser,
          pfp_url: userData?.profile_pic_url,
          username: userData?.name,
        };

        setUser(fullUser);
      } else {
        setUser(null);
      }

      setToken(session?.access_token ?? null);

      if (session?.access_token) {
        localStorage.setItem(TOKEN_KEY, session.access_token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    });

    // Keep state in sync when Supabase refreshes token
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      const authUser = session?.user ?? null;

      if (authUser) {
        // FETCH custom user data on auth state change too
        const { data: userData } = await supabase
          .from("users")
          .select("profile_pic_url, name")
          .eq("user_id", authUser.id)
          .single();

        const fullUser = {
          ...authUser,
          pfp_url: userData?.profile_pic_url,
          username: userData?.name,
        };

        setUser(fullUser);
      } else {
        setUser(null);
      }

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

  // sign up
  const signup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });
  
    if (error) throw error;
  
    const userId = data.user.id;
    const defaultPfp = 'https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/profile_pics/basicPfp.jpg';
  
    await supabase.from("users").insert({
      user_id: userId,
      name: "",
      profile_pic_url: defaultPfp,
      role: "",
      preferences: {}
    });
  
    // set user state immediately with default values
    const fullUser = {
      ...data.user,
      pfp_url: defaultPfp,
      username: "",
    };
    
    setUser(fullUser);
    setToken(data.session.access_token);
    localStorage.setItem(TOKEN_KEY, data.session.access_token);
  };

  // login
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const session = data?.session ?? null;
    const authUser = session?.user;

    // fetch custom user data
    const { data: userData } = await supabase
      .from("users")
      .select("profile_pic_url, name")
      .eq("user_id", authUser.id)
      .single();

    // combine auth user with custom data
    const fullUser = {
      ...authUser,
      pfp_url: userData?.profile_pic_url,
      username: userData?.name,
    };

    setUser(fullUser);
    setToken(session?.access_token ?? null);

    if (session?.access_token) {
      localStorage.setItem(TOKEN_KEY, session.access_token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }

    return data;
  };

  // logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  // used when new pfp is selected to refresh the image
  const refreshUser = async () => {
    if (!user?.id) return;

    const { data: userData } = await supabase
      .from("users")
      .select("profile_pic_url, name")
      .eq("user_id", user.id)
      .single();

    setUser({
      ...user,
      pfp_url: userData?.profile_pic_url,
      username: userData?.name,
    });
  };

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const value = useMemo(
    () => ({ user, token, isUserLoggedIn, authHeaders, login, logout, signup, refreshUser }),
    [user, token, isUserLoggedIn, authHeaders]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
