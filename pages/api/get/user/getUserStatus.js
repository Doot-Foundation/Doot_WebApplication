const { supabase } = require("@/utils/helper/init/InitSupabase.js");

export default async function handler(req, res) {
  const { address } = req.query;

  if (address) {
    const MAIL = process.env.SUPABASE_USER;
    const PASS = process.env.SUPABASE_USER_PASS;

    await supabase.auth.signInWithPassword({
      email: MAIL,
      password: PASS,
    });

    const { data: select_data, error: select_error } = await supabase
      .from("Auro_Login")
      .select("address")
      .eq("address", address);

    await supabase.auth.signOut();

    if (select_data != null && select_data.length != 0) {
      return res
        .status(200)
        .json({ status: true, message: "Public key exists." });
    } else {
      return res
        .status(200)
        .json({ status: false, message: "Public Key does not exists." });
    }
  }
  return res
    .status(400)
    .json({ status: 400, message: "ERR! Query parameter missing(address)." });
}
