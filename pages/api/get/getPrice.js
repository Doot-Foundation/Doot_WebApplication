const MAIL = process.env.SUPABASE_USER;
const PASS = process.env.SUPABASE_USER_PASS;

import { supabase } from "../../../utils/helper/InitSupabase.js";
import { TOKEN_TO_CACHE } from "../../../utils/constants/info.js";
import { redis } from "../../../utils/helper/InitRedis.js";
import { validate as uuidValidate } from "uuid";

export default async function handler(req, res) {
  // Retrieve data from the cache
  const authHeader = req.headers.authorization;
  const { token } = req.query;

  await supabase.auth.signInWithPassword({
    email: MAIL,
    password: PASS,
  });

  if (authHeader) {
    const key = authHeader.split(" ")[1];

    const { data: select_data, error: select_error } = await supabase
      .from("Auro_Login")
      .select("generated_key")
      .eq("generated_key", key);

    await supabase.auth.signOut();

    if (select_data.length == 0 || !uuidValidate(key)) {
      return res.status(401).json("Unauthorized.");
    }

    const cachedData = await redis.get(TOKEN_TO_CACHE[token.toLowerCase()]);

    if (cachedData) {
      return res.status(200).json({ data: cachedData });
    } else {
      return res.status(404).json({ message: "Cached data not found." });
    }
  }
  return res.status(401).json("Unauthrized Auth.");
}
