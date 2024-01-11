const MAIL = process.env.SUPABASE_USER;
const PASS = process.env.SUPABASE_USER_PASS;

import { supabase } from "../../utils/helper/InitSupabase.js";

import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  const { address } = req.query;

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.API_INTERFACE_KEY}`) {
    res.status(401).json("Unauthorized");
  }

  await supabase.auth.signInWithPassword({
    email: MAIL,
    password: PASS,
  });

  const { data: select_data, error: select_error } = await supabase
    .from("Auro_Login")
    .select("address")
    .eq("address", address);

  if (select_data.length != 0) {
    await supabase.auth.signOut();
    res.status(200).json({ message: "Already Exists." });
    return;
  }

  const assignedKey = uuidv4();
  await supabase
    .from("Auro_Login")
    .insert([{ address: address, generated_key: assignedKey }]);

  await supabase.auth.signOut();

  res.status(201).json({ message: "Created.", key: assignedKey });
}
