const MAIL = process.env.SUPABASE_USER;
const PASS = process.env.SUPABASE_USER_PASS;

import { supabase } from "../../../utils/helper/InitSupabase.js";

import { validate as uuidValidate } from "uuid";

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const { address } = req.query;

  await supabase.auth.signInWithPassword({
    email: MAIL,
    password: PASS,
  });

  const { data: select_data, error: select_error } = await supabase
    .from("Auro_Login")
    .select("generated_key")
    .eq("address", address);

  await supabase.auth.signOut();

  if (
    select_data.length == 0 ||
    !uuidValidate(authHeader.split(" ")[1]) ||
    "Bearer " + select_data[0].generated_key != authHeader
  ) {
    res.status(200).json({ status: false });
    return;
  } else {
    res.status(200).json({ status: true });
  }
}
