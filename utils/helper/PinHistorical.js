const axios = require("axios");

const JWT = process.env.PINATA_JWT;
const GATEWAY = process.env.PINATA_GATEWAY;

export default async function pinHistoricalObject(previousCID, latestPrices) {
  // const previousCID = await getHistoricalCache();
  const res = await axios.get(`https://${GATEWAY}/ipfs/${previousCID}`);

  let toUploadObject;
  let isFirst;

  if (!res.status || res.status >= 300 || !res.data) {
    isFirst = true;
    toUploadObject = {
      latest: {
        timestamp: Date.now(),
        prices: latestPrices,
      },
      historical: {},
    };
  } else {
    isFirst = false;
    const previousObject = res.data;
    const previousTimestamp = previousObject.latest.timestamp;
    const previousPrices = previousObject.latest.prices;
    const previousHistorical = previousObject.historical;

    const updatedHistorical = previousHistorical;
    updatedHistorical[previousTimestamp] = previousPrices;

    toUploadObject = {
      latest: {
        timestamp: Date.now(),
        prices: latestPrices,
      },
      historical: updatedHistorical,
    };
  }

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

    if (!isFirst) {
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
    }

    return updatedCID;
  } catch (error) {
    console.log(error);
  }
}
