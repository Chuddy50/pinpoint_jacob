// src/contexts/AuthContext.jsx
import { createContext, useContext, useState } from "react";

const TOKEN_KEY = "p_token";
const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // NOTE: setting up more information about the user
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY)); // get token from local storage (provided by browsers)

  const isUserLoggedIn = !!token; // truthy val, not null means true

  // functions to manually set/clear userId
  // const login = (userData) => setUser(userData)
  // const logout = () => setUser(null)

  const login = async (email, password) => {
    const loginHeaders = { Authorization: `Bearer ${token}` };
    //const { email, id } = data;

    // use Supabase for getting JWT
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    const { session, user } = data;

    setToken(session.access_token); // sets loggedIn to true
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, token);
  };

  async function logout() {
    await supabase.auth.signOut();

    setUser(null);
    setToken(null);

    localStorage.removeItem(TOKEN_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isUserLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);




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

