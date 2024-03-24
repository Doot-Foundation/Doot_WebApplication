// Sign a message on ui, check the sign here and if the originator is the address sent in the req.query,
// return the api key.
const {
  signatureClient,
  mainnetSignatureClient,
} = require("../../../utils/helper/SignatureClient");
const KEY = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

const MAIL = process.env.SUPABASE_USER;
const PASS = process.env.SUPABASE_USER_PASS;

import { supabase } from "../../../utils/helper/InitSupabase.js";

// MESSAGE
// Sign this message to prove you have access to this wallet in order to sign in to doot.foundation/dashboard.
// This won't cost you any Mina.
// Timestamp: Date.now()

// https://docs.aurowallet.com/general/reference/api-reference/methods/mina_signmessage

export default async function handler(req, res) {
  if (req.method == "GET") {
    const signHeader = JSON.parse(req.headers.signed);
    const authHeader = req.headers.authorization;

    if ("Bearer " + KEY != authHeader) {
      res.status(401).json({ status: "Unauthorized." });
      return;
    }

    const timestamp = signHeader.timestamp;
    const currentTimestamp = Date.now();

    const diffMillis = currentTimestamp - timestamp;
    const diffMins = diffMillis / (1000 * 60);

    if (diffMins > 60) {
      return res
        .status(401)
        .json({ status: "Timestamp out of the accepted range." });
    }

    const toVerifyMessage = `Sign this message to prove you have access to this wallet in order to sign in to doot.foundation/dashboard. This won't cost you any Mina. Timestamp:${timestamp}`;
    const verifyBody = {
      data: toVerifyMessage,
      publicKey: signHeader.publicKey,
      signature: signHeader.signature,
    };

    const originsVerified = signatureClient.verifyMessage(verifyBody);
    const mainnetOriginsVerified =
      mainnetSignatureClient.verifyMessage(verifyBody);

    if (!originsVerified && !mainnetOriginsVerified) {
      return res.status(401).json({ status: "Signature Failed." });
    }

    await supabase.auth.signInWithPassword({
      email: MAIL,
      password: PASS,
    });

    const { data: select_data, error: select_error } = await supabase
      .from("Auro_Login")
      .select("*")
      .eq("address", signHeader.publicKey);

    await supabase.auth.signOut();

    if (select_data.length == 1) {
      return res.status(200).json(JSON.stringify(select_data[0]));
    } else {
      return res.status(200).json({ data: null });
    }
  }
}
