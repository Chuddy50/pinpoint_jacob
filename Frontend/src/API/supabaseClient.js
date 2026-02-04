// creates a single supabase connection used thru out frontend
// imported into AuthContext.jsx to do 'supabase.auth.signInWithPassword()'
// need to import anywhere else we wanna use a supabase client in frontend
// can use for:
//   - auth
//   - direct db query
//   - file storage


import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
