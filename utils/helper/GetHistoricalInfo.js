const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

export default async function getHistoricalInfo(cid) {
  const axios = require("axios");
  const res = await axios.get(`https://${GATEWAY}/ipfs/${cid}`);
  const ipfsData = res.data;

  return ipfsData;
}
