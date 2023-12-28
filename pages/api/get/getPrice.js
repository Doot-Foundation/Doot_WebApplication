const MAIL = process.env.SUPABASE_USER;
const PASS = process.env.SUPABASE_USER_PASS;

import { supabase } from "../../../utils/helper/InitSupabase.js";
import { getCache } from "../../../utils/helper/CacheHandler.js";

export default async function handler(req, res) {
  // Retrieve data from the cache
  const authHeader = req.headers.authorization;
  const { address, token } = req.query;

  await supabase.auth.signInWithPassword({
    email: MAIL,
    password: PASS,
  });

  const { data: select_data, error: select_error } = await supabase
    .from("Auro_Login")
    .select("generated_key")
    .eq("address", address);

  if (
    (select_data.length == 0) |
    ("Bearer " + select_data[0].generated_key != authHeader)
  ) {
    await supabase.auth.signOut();
    res.status(401).json("Unauthorized.");
    return;
  }

  const cachedData = await getCache(token);

  await supabase.auth.signOut();

  if (cachedData) {
    return res.status(200).json({ price: cachedData });
  } else {
    return res.status(404).json({ message: "Cached data not found." });
  }
}
