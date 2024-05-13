const MAIL = process.env.SUPABASE_USER;
const PASS = process.env.SUPABASE_USER_PASS;

import { supabase } from "../../../utils/helper/InitSupabase.js";
import { redis } from "../../../utils/helper/InitRedis.js";
import incrementCallCounter from "../../../utils/helper/IncrementCallCounter.js";

import { TOKEN_TO_CACHE } from "../../../utils/constants/info.js";

import { validate as uuidValidate } from "uuid";

export default async function handler(req, res) {
  // Retrieve data from the cache
  const authHeader = req.headers.authorization;
  const { token } = req.query;

  if (authHeader) {
    await supabase.auth.signInWithPassword({
      email: MAIL,
      password: PASS,
    });

    const key = authHeader.split(" ")[1];

    const { data: select_data, error: select_error } = await supabase
      .from("Auro_Login")
      .select("generated_key, calls")
      .eq("generated_key", key);

    if (select_data.length == 0 || !uuidValidate(key)) {
      await supabase.auth.signOut();
      return res.status(401).json("Unauthorized.");
    }

    const calls = JSON.parse(select_data[0].calls);
    const updatedCalls = JSON.stringify(await incrementCallCounter(calls));

    const { data, error } = await supabase
      .from("Auro_Login")
      .update({ calls: updatedCalls })
      .eq("generated_key", key);

    await supabase.auth.signOut();

    const cachedData = await redis.get(TOKEN_TO_CACHE[token.toLowerCase()]);

    if (cachedData) {
      return res.status(200).json({ data: cachedData });
    } else {
      return res.status(404).json({ message: "Cached data not found." });
    }
  }
  return res.status(401).json("Unauthrized Auth.");
}
