// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../API/supabaseClient";

const AuthContext = createContext(null);

const DEFAULT_PFP =
  "https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/profile_pics/basicPfp.jpg";

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null); // merged auth + profile fields
  const [authLoading, setAuthLoading] = useState(true);

  // 1) ensure public.users row exists, then hydrate pfp/name
  const upsertAndHydrateProfile = async (authUser) => {
    if (!authUser) return;

    const username =
      authUser.user_metadata?.name ||
      (authUser.email ? authUser.email.split("@")[0] : "user");

    const avatar =
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture || // sometimes present
      DEFAULT_PFP;

    // Ensure row exists for BOTH email/password and OAuth users
    // (Doesn't overwrite existing values unless they're null/you choose to)
    await supabase
      .from("users")
      .upsert(
        {
          user_id: authUser.id,
          name: username,
          profile_pic_url: avatar,
          role: "",
          preferences: {},
        },
        { onConflict: "user_id" }
      );

    const { data, error } = await supabase
      .from("users")
      .select("profile_pic_url, name")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (error) {
      console.warn("users profile fetch failed:", error);
      // still keep auth user
      setUser((prev) => ({
        ...(prev?.id === authUser.id ? prev : {}),
        ...authUser,
      }));
      return;
    }

    setUser({
      ...authUser,
      pfp_url: data?.profile_pic_url ?? avatar,
      username: data?.name ?? username,
    });
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    await upsertAndHydrateProfile(user);
  };

  // 2) apply session as the single source of truth
  const applySession = async (newSession) => {
    setSession(newSession);

    const authUser = newSession?.user ?? null;
    if (!authUser) {
      setUser(null);
      return;
    }

    // fast UI: show "logged in" immediately with auth user
    setUser((prev) =>
      prev?.id === authUser.id ? { ...prev, ...authUser } : { ...authUser }
    );

    // hydrate custom fields in background (do not block auth state)
    upsertAndHydrateProfile(authUser).catch((error) => {
      console.warn("profile hydrate failed:", error);
    });
  };

  // 3) restore session on refresh + subscribe to auth changes
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!alive) return;
        if (error) console.warn("getSession error:", error);
        await applySession(data?.session ?? null);
      } finally {
        if (alive) setAuthLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!alive) return;
      try {
        await applySession(newSession);
      } finally {
        if (alive) setAuthLoading(false);
      }
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // --- Auth actions ---

  const signup = async (username, email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // If session exists immediately, apply it and overwrite name with provided username
    if (data?.session?.user) {
      // Prefer the username from the signup form
      await supabase
        .from("users")
        .upsert(
          {
            user_id: data.session.user.id,
            name: username,
            profile_pic_url: DEFAULT_PFP,
            role: "",
            preferences: {},
          },
          { onConflict: "user_id" }
        );

      await applySession(data.session);
    }

    return data;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Fast UI + profile hydrate
    await applySession(data?.session ?? null);
    return data;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will clear state, but we can do it immediately too
    setSession(null);
    setUser(null);
  };

  // derive token + headers ONLY from Supabase session
  const token = session?.access_token ?? null;

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const isUserLoggedIn = !!user && !authLoading;

  const value = useMemo(
    () => ({
      user,
      session,
      token,
      authHeaders,
      authLoading,
      isUserLoggedIn,
      signup,
      login,
      logout,
      refreshUser,
      signInWithGoogle,
    }),
    [
      user,
      session,
      token,
      authHeaders,
      authLoading,
      isUserLoggedIn,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
