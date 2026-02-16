import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../API/supabaseClient";

const TOKEN_KEY = "pinpoint_JWT";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isUserLoggedIn = !!token;

  const clearAuthState = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const applyBasicAuthState = (authUser, accessToken) => {
    if (!authUser) return;
    setUser((prev) => ({
      ...(prev || {}),
      ...authUser,
      // preserve previously loaded profile fields if available
      pfp_url: prev?.pfp_url,
      username: prev?.username,
    }));
    setToken(accessToken ?? null);
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  };

  const tryHydrateFromStoredToken = async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) return false;

    const { data, error } = await supabase.auth.getUser(storedToken);
    if (error || !data?.user) return false;

    await applySession({
      user: data.user,
      access_token: storedToken,
    });
    return true;
  };

  const applySession = async (session) => {
    const authUser = session?.user ?? null;
    const accessToken = session?.access_token ?? null;

    if (!authUser) {
      setUser(null);
      setToken(null);
      return;
    }

    // Apply auth state immediately so UI updates right after login.
    applyBasicAuthState(authUser, accessToken);

    try {
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("profile_pic_url, name")
        .eq("user_id", authUser.id)
        .single();

      if (userErr) {
        console.warn("users table fetch failed:", userErr);
        return;
      }

      setUser((prev) => ({
        ...(prev || {}),
        ...authUser,
        pfp_url: userData?.profile_pic_url,
        username: userData?.name,
      }));
    } catch (error) {
      console.warn("users profile hydrate failed:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      try {
        if (event === "SIGNED_OUT") {
          clearAuthState();
          return;
        }
        await applySession(session);
      } catch (error) {
        console.warn("onAuthStateChange error:", error);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    });

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (error) {
          console.warn("getSession error:", error);
          clearAuthState();
          return;
        }

        const session = data?.session ?? null;
        if (session?.user) {
          await applySession(session);
        } else {
          const restored = await tryHydrateFromStoredToken();
          if (!restored) clearAuthState();
        }
      } catch (error) {
        console.warn("initial auth hydrate error:", error);
        clearAuthState();
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signup = async (username, email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data?.user) {
      const defaultPfp =
        "https://nsxnjccttoutxxagdlai.supabase.co/storage/v1/object/public/profile_pics/basicPfp.jpg";
      await supabase.from("users").upsert(
        {
          user_id: data.user.id,
          name: username,
          profile_pic_url: defaultPfp,
          role: "",
          preferences: {},
        },
        { onConflict: "user_id" }
      );
    }

    if (data?.session?.user) {
      await applySession(data.session);
    }

    return data;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data?.session?.user) {
      // Immediately reflect logged-in state in UI.
      applyBasicAuthState(data.session.user, data.session.access_token);
      // Ensure Supabase client persists session/refresh token for reloads.
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      await applySession(data.session);
    }

    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    clearAuthState();
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
    return data;
  };

  const refreshUser = async () => {
    if (!user?.id) return;

    const { data: userData } = await supabase
      .from("users")
      .select("profile_pic_url, name")
      .eq("user_id", user.id)
      .single();

    setUser((prev) => ({
      ...prev,
      pfp_url: userData?.profile_pic_url,
      username: userData?.name,
    }));
  };

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isUserLoggedIn,
      authLoading,
      authHeaders,
      login,
      logout,
      signup,
      refreshUser,
      signInWithGoogle,
    }),
    [user, token, isUserLoggedIn, authLoading, authHeaders]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
