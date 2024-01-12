const MAIL = process.env.SUPABASE_USER;
const PASS = process.env.SUPABASE_USER_PASS;

import { supabase } from "../../utils/helper/InitSupabase.js";

import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  const { address } = req.query;

  console.log("1");
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.API_INTERFACE_KEY}`) {
    res.status(401).json("Unauthorized");
  }

  console.log("2");
  await supabase.auth.signInWithPassword({
    email: MAIL,
    password: PASS,
  });

  console.log("3");
  const { data: select_data, error: select_error } = await supabase
    .from("Auro_Login")
    .select("address")
    .eq("address", address);

  console.log("4");
  if (select_data.length != 0) {
    await supabase.auth.signOut();
    res.status(200).json({ message: "Already Exists." });
    return;
  }

  console.log("5");
  const assignedKey = uuidv4();
  await supabase
    .from("Auro_Login")
    .insert([{ address: address, generated_key: assignedKey }]);
  console.log("6");

  await supabase.auth.signOut();
  console.log("7");

  res.status(201).json({ message: "Created.", key: assignedKey });
}
