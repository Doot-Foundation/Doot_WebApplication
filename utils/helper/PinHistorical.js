const axios = require("axios");

const JWT = process.env.PINATA_JWT;
const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

export default async function pinHistoricalObject(previousCID, latestPrices) {
  // const previousCID = await getHistoricalCache();

  let isFirst;
  let toUploadObject;

  if (previousCID == "NULL") {
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
    console.log("endpoint :", `https://${GATEWAY}/ipfs/${previousCID}`);

    const res = await axios.get(`https://${GATEWAY}/ipfs/${previousCID}`);
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

  console.log(toUploadObject);

  const timestamp = Date.now();
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${JWT}`,
    },
    body: JSON.stringify({
      pinataContent: toUploadObject,
      pinataMetadata: { name: `historical_${timestamp}.json` },
    }),
  };

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    options
  );
  const data = await response.json();
  console.log(data);

  if (!isFirst) {
    const options = {
      method: "DELETE",
      headers: { accept: "application/json", authorization: `Bearer ${JWT}` },
    };

    const deleteResponse = fetch(
      `https://api.pinata.cloud/pinning/unpin/${previousCID}`,
      options
    );
    const deleteData = await deleteResponse.json();
    console.log(`DELETED PREVIOUS AT ${previousCID}\n`, deleteData);
  }

  return data.IpfsHash;
}
