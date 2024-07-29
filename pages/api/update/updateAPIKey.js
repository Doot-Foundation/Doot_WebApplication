const MAIL = process.env.SUPABASE_USER;
const PASS = process.env.SUPABASE_USER_PASS;

import { supabase } from "../../../utils/helper/InitSupabase.js";
import { validate as uuidValidate, v4 as uuidv4 } from "uuid";

const KEY = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const userInformation = JSON.parse(req.headers.user);

  if ("Bearer " + KEY != authHeader) {
    return res.status(401).json("Unauthorized.");
  }

  await supabase.auth.signInWithPassword({
    email: MAIL,
    password: PASS,
  });

  if (userInformation) {
    const publicKey = userInformation.address;
    const key = userInformation.key;
    console.log(publicKey, "called reset with original key :", key);

    const { data: select_data, error: select_error } = await supabase
      .from("Auro_Login")
      .select("generated_key, address")
      .eq("generated_key", key);

    if (
      select_data.length == 0 ||
      !uuidValidate(key) ||
      select_data[0]?.address != publicKey
    ) {
      return res.status(401).json("Unauthorized.");
    }

    const updatedKey = uuidv4();
    const { data, error } = await supabase
      .from("Auro_Login")
      .update({ generated_key: updatedKey })
      .eq("generated_key", key);

    await supabase.auth.signOut();

    return res.status(200).json({
      status: true,
      data: updatedKey,
      message: "Updated API key successfully.",
    });
  } else
    return res.status(400).json({
      status: 400,
      message:
        "ERR! User information not found in header. Header should include 'User:[...]'.",
    });
}
