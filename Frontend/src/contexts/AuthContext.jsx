// // src/contexts/AuthContext.jsx
// import { createContext, useContext, useState } from "react";
// import { supabase } from "../lib/supabaseClient";


// const TOKEN_KEY = "pinpoint_JWT";
// const AuthContext = createContext({});

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   // NOTE: setting up more information about the user
//   const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY)); // get token from local storage (provided by browsers)

//   const isUserLoggedIn = !!token; // truthy val, not null means true

//   // functions to manually set/clear userId
//   // const login = (userData) => setUser(userData)
//   // const logout = () => setUser(null)

//     const login = async (email, password, userData) => {
//       const loginHeaders = { Authorization: `Bearer ${token}` };
//       //const { email, id } = data;

//       // use Supabase for getting JWT
//       const { data, error } = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       });

//       if (error) {
//         throw error;
//       }

//       const { session, user } = data;

//       setToken(session.access_token); // sets loggedIn to true
//       setUser(userData);
//       localStorage.setItem(TOKEN_KEY, token);
//     };

//     async function logout() {
//       await supabase.auth.signOut();
//       setUser(null);
//       setToken(null);
//       localStorage.removeItem(TOKEN_KEY);
//     }

//     return (
//       <AuthContext.Provider value={{ user, login, logout, isUserLoggedIn }}>
//         {children}
//       </AuthContext.Provider>
//     );
// };

// export const useAuth = () => useContext(AuthContext);






// // src/contexts/AuthContext.jsx
// import { createContext, useContext, useState } from 'react'

// const AuthContext = createContext({})

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null)

//   // functions to manually set/clear userId
//   const login = (userData) => setUser(userData)
//   const logout = () => setUser(null)

//   return (
//     <AuthContext.Provider value={{ user, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export const useAuth = () => useContext(AuthContext)


// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../api/supabaseClient";

const TOKEN_KEY = "pinpoint_JWT";
const AuthContext = createContext(null);

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

    return data; // handy for callers that want the full response
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
