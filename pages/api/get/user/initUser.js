const { supabase } = require("../../../../utils/helper/init/InitSupabase.js");
const uuid = require("uuid");
const uuidv4 = uuid.v4;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const { address } = req.query;

  if (authHeader !== `Bearer ${process.env.NEXT_PUBLIC_API_INTERFACE_KEY}`) {
    return res.status(401).json("Unauthorized");
  }

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

    if (select_data != null && select_data.length != 0) {
      await supabase.auth.signOut();
      res
        .status(200)
        .json({ status: true, message: "Already Exists.", key: "" });
      return;
    }

    const assignedKey = uuidv4();
    await supabase
      .from("Auro_Login")
      .insert([{ address: address, generated_key: assignedKey }]);

    await supabase.auth.signOut();

    res.status(201).json({
      status: true,
      message: "Generated API key successfully.",
      key: assignedKey,
    });
    return;
  } else
    return res.status(400).json({
      status: 400,
      message: "ERR! Query parameter missing(address).",
      key: "",
    });
}
