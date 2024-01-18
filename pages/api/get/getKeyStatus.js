import { supabase } from "../../../utils/helper/InitSupabase";

const MAIL = process.env.SUPABASE_USER;
const PASS = process.env.SUPABASE_USER_PASS;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;

  await supabase.auth.signInWithPassword({
    email: MAIL,
    password: PASS,
  });

  const { data: select_data, error: select_error } = await supabase
    .from("Auro_Login")
    .select("generated_key")
    .eq("generated_key", authHeader);

  await supabase.auth.signOut();

  if (select_data[0].length == 0) return res.status(200).json({ valid: true });
  else return res.status(200).json({ valid: false });
}
