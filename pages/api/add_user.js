const MAIL = process.env.SUPABASE_USER;
const PASS = process.env.SUPABASE_USER_PASS;

import { supabase } from "@/utils/InitSupabase";

export default async function handler(req, res) {
  const { address } = req.query;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: MAIL,
    password: PASS,
  });

  console.log(data);
  res.status(200).json({ message: "Success" });
}
