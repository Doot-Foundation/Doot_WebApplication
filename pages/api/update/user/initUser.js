const { supabaseService } = require("@/utils/helper/init/InitSupabase.js");
const uuid = require("uuid");
const uuidv4 = uuid.v4;

const KEY = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const { address } = req.query;

  if ("Bearer " + KEY != authHeader) {
    return res.status(401).json("Unauthorized.");
  }

  if (address) {

    const { data: select_data, error: select_error } = await supabaseService
      .from("login")
      .select("address")
      .eq("address", address);

    if (select_data != null && select_data.length != 0) {
            return res
        .status(200)
        .json({ status: true, message: "Already Exists.", key: "" });
    }

    const assignedKey = uuidv4();
    await supabaseService
      .from("login")
      .insert([{ address: address, generated_key: assignedKey }]);

    
    return res.status(201).json({
      status: true,
      message: "Generated API key successfully.",
      publicKey: address,
      data: assignedKey,
    });
  } else
    return res.status(400).json({
      status: 400,
      publicKey: address,
      message: "ERR! Query parameter missing(address).",
      data: null,
    });
}
