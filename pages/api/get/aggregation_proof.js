const { supabase } = require("../../../utils/helper/init/InitSupabase.js");
const { redis } = require("../../../utils/helper/init/InitRedis.js");
const incrementCallCounter = require("../../../utils/helper/IncrementCallCounter.js");

const {
  TOKEN_TO_AGGREGATION_PROOF_CACHE,
  TOKEN_TO_SYMBOL,
} = require("../../../utils/constants/info.js");

const uuid = require("uuid");
const uuidValidate = uuid.validate;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  let { token } = req.query;

  if (token) {
    token = token.toLowerCase();

    if (!TOKEN_TO_SYMBOL[token])
      return res
        .status(400)
        .json({ status: 400, message: "ERR! Invalid token." });

    if (authHeader) {
      const MAIL = process.env.SUPABASE_USER;
      const PASS = process.env.SUPABASE_USER_PASS;

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

      const { data: update_data } = await supabase
        .from("Auro_Login")
        .update({ calls: updatedCalls })
        .eq("generated_key", key);

      await supabase.auth.signOut();

      const cachedData = await redis.get(
        TOKEN_TO_AGGREGATION_PROOF_CACHE[token]
      );
      if (cachedData) {
        return res.status(200).json({
          status: true,
          message: "Latest proof information found.",
          data: cachedData,
          asset: token,
        });
      } else {
        return res.status(404).json({
          status: false,
          message: "Proof information not found.",
          data: {},
          asset: token,
        });
      }
    } else
      return res
        .status(401)
        .json(
          "ERR! Authentication Failed. Missing header `Authorization:Bearer [API_KEY]'."
        );
  }
  return res
    .status(400)
    .json({ status: 400, message: "ERR! Query parameter missing(token)." });
}
