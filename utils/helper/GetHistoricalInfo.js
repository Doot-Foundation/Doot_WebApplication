const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
const axios = require("axios");

/**
 * Fetches historical IPFS data with error handling and timeout
 * @param {string} cid - IPFS content identifier
 * @returns {Promise<Object>} Historical data
 */
async function getHistoricalInfo(cid) {
  try {
    // Set timeout and create URL once
    const config = {
      timeout: 10000, // 10 second timeout
      headers: {
        Accept: "application/json",
      },
    };
    const url = `https://${GATEWAY}/ipfs/${cid}`;

    const res = await axios.get(url, config);
    return res.data;
  } catch (error) {
    console.error(
      `IPFS fetch failed for CID ${cid}:`,
      error.message || "Unknown error"
    );
    throw error;
  }
}

module.exports = getHistoricalInfo;
