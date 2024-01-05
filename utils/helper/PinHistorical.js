const axios = require("axios");
const { updateHistoricalCache, getHistoricalCache } = require("./CacheHandler");

const JWT = process.env.PINATA_JWT;
const GATEWAY = process.env.PINATA_GATEWAY;

export default async function pinHistoricalObject(latestPrices) {
  const previousCID = await getHistoricalCache();
  const res = await axios.get(`https://${GATEWAY}/ipfs/${previousCID}`);

  const previousObject = res.data;
  const previousTimestamp = previousObject.latest.timestamp;
  const previousPrices = previousObject.latest.prices;
  const previousHistorical = previousObject.historical;

  const updatedHistorical = previousHistorical;
  updatedHistorical[previousTimestamp] = previousPrices;

  const toUploadObject = {
    latest: {
      timestamp: Date.now(),
      prices: latestPrices,
    },
    historical: updatedHistorical,
  };

  const pinataMetadata = JSON.stringify({
    name: `historical_${Date.now()}.json`,
  });

  try {
    const upload_options = {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${JWT}`,
      },
      data: { pinataContent: toUploadObject, pinataMetadata: pinataMetadata },
    };
    const upload_res = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      upload_options
    );
    const updatedCID = upload_res.data.IpfsHash;
    await updateHistoricalCache(updatedCID);

    const delete_options = {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${JWT}`,
      },
    };

    await axios.delete(
      `https://api.pinata.cloud/pinning/unpin/${previousCID}`,
      delete_options
    );
  } catch (error) {
    console.log(error);
  }
}
