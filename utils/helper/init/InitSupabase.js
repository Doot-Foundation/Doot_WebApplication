const SUPABASE_URL = process.env.SUPABASE_URL;
// const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

module.exports = {
  // supabase,
  supabaseService,
};
