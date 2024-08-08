const { supabase } = require("../../../../utils/helper/init/InitSupabase.js");
const {
  testnetSignatureClient,
  mainnetSignatureClient,
} = require("../../../../utils/helper/SignatureClient.js");

const KEY = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

export default async function handler(req, res) {
  const signHeader = JSON.parse(req.headers.signed);
  const authHeader = req.headers.authorization;

  if ("Bearer " + KEY != authHeader) {
    return res.status(401).json({ status: "Unauthorized." });
  }

  if (signHeader) {
    const timestamp = signHeader.timestamp;
    const currentTimestamp = Date.now();

    const diffMillis = currentTimestamp - timestamp;
    const diffMins = diffMillis / (1000 * 60);

    if (diffMins > 60) {
      return res
        .status(401)
        .json({ status: "Timestamp out of the accepted range." });
    }

    // MESSAGE
    // Sign this message to prove you have access to this wallet in order to sign in to doot.foundation/dashboard.
    // This won't cost you any Mina.
    // Timestamp: Date.now()
    // https://docs.aurowallet.com/general/reference/api-reference/methods/mina_signmessage
    const toVerifyMessage = `Sign this message to prove you have access to this wallet in order to sign in to doot.foundation/dashboard. This won't cost you any Mina. Timestamp:${timestamp}`;
    const verifyBody = {
      data: toVerifyMessage,
      publicKey: signHeader.publicKey,
      signature: signHeader.signature,
    };

    const testnetOriginsVerified =
      testnetSignatureClient.verifyMessage(verifyBody);
    const mainnetOriginsVerified =
      mainnetSignatureClient.verifyMessage(verifyBody);

    if (!testnetOriginsVerified && !mainnetOriginsVerified) {
      return res.status(401).json({ status: "Signature Failed." });
    }

    const MAIL = process.env.SUPABASE_USER;
    const PASS = process.env.SUPABASE_USER_PASS;

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
      return res.status(200).json({
        status: true,
        data: select_data[0],
        message: "User data found.",
      });
    } else {
      return res
        .status(200)
        .json({ status: false, data: null, message: "User data not found." });
    }
  }
  return res.status(400).json({
    stats: 400,
    data: null,
    message:
      "ERR! Signature not found in header. Header should include 'Signed:[...]'.",
  });
}
