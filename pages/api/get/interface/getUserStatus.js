import { supabase } from "../../../../utils/helper/InitSupabase.js";

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
      return res.status(200).json({ status: 1, message: "Address_Exists" });
    } else {
      return res
        .status(200)
        .json({ status: 0, message: "Address_Does_Not_Exist" });
    }
  }
  res.status(404).json({ message: "Query parameter missing(address)." });
}
