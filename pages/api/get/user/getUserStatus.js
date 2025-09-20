const { supabaseService } = require("@/utils/helper/init/InitSupabase.js");

export default async function handler(req, res) {
  const { address } = req.query;

  if (address) {

    const { data: select_data, error: select_error } = await supabaseService
      .from("login")
      .select("address")
      .eq("address", address);


    if (select_data != null && select_data.length != 0) {
      return res
        .status(200)
        .json({ status: true, message: "Public key exists." });
    } else {
      return res
        .status(200)
        .json({ status: false, message: "Public Key does not exists." });
    }
  }
  return res
    .status(400)
    .json({ status: 400, message: "ERR! Query parameter missing(address)." });
}
