const MAIL = process.env.SUPABASE_USER;
const PASS = process.env.SUPABASE_USER_PASS;

import { supabase } from "../../../utils/helper/InitSupabase.js";

export default async function handler(req, res) {
  const { address } = req.query;

  await supabase.auth.signInWithPassword({
    email: MAIL,
    password: PASS,
  });

  const { data: select_data, error: select_error } = await supabase
    .from("Auro_Login")
    .select("address")
    .eq("address", address);

  await supabase.auth.signOut();

  if (select_data.length != 0) {
    return res
      .status(200)
      .json({ status_message: "Address_Exists", status: 1 });
  } else {
    return res
      .status(200)
      .json({ status_message: "Address_Does_Not_Exist", status: 0 });
  }
}
