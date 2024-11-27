const { supabase } = require("@/utils/helper/init/InitSupabase.js");

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;

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
      .select("generated_key")
      .eq("generated_key", key);

    await supabase.auth.signOut();

    if (select_data[0].length != 0)
      return res.status(200).json({ status: true, message: "Valid API Key." });
    else
      return res
        .status(200)
        .json({ status: false, message: "Invalid API Key." });
  }
  return res.status(400).json({
    status: 400,
    message:
      "ERR! API Key not found in header. Header should include 'Authorization:Bearer [API_KEY]'. For more information visit : https://doot.foundation/dashboard.",
  });
}
