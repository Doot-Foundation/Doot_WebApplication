const fs = require("fs");
const os = require("os");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

const PIN_FILE_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";

function ensurePinataJwt() {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error("Missing PINATA_JWT environment variable");
  }
  return jwt;
}

function ensureGateway() {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
  if (!gateway) {
    throw new Error("Missing NEXT_PUBLIC_PINATA_GATEWAY environment variable");
  }
  return gateway;
}

async function pinJsonAsTextFile(content, metadataName) {
  const jwt = ensurePinataJwt();
  const serialized =
    typeof content === "string" ? content : JSON.stringify(content);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pinata-"));
  const safeName = metadataName || `payload_${Date.now()}`;
  const fileName = `${safeName}.txt`;
  const filePath = path.join(tmpDir, fileName);

  try {
    fs.writeFileSync(filePath, serialized, "utf8");

    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), fileName);
    form.append("pinataMetadata", JSON.stringify({ name: safeName }));

    const response = await axios.post(PIN_FILE_ENDPOINT, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${jwt}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return response.data;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn("Failed to clean temp directory:", cleanupError.message);
    }
  }
}

async function fetchJsonFromCid(cid) {
  const gateway = ensureGateway();
  const url = `https://${gateway}/ipfs/${cid}`;

  const response = await axios.get(url, {
    responseType: "text",
    timeout: 10000,
    headers: {
      Accept: "text/plain, application/json",
    },
  });

  try {
    return JSON.parse(response.data);
  } catch (error) {
    throw new Error(`Failed to parse IPFS JSON payload for CID ${cid}: ${error.message}`);
  }
}

module.exports = {
  pinJsonAsTextFile,
  fetchJsonFromCid,
};
