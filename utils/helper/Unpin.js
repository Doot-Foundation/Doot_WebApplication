/**
 * Unpins a file from Pinata IPFS
 * @param {string} cid - Content identifier to unpin
 * @param {string} functionName - Name of calling function for logging
 * @returns {Promise<void>}
 */
async function unpin(cid, functionName) {
  try {
    console.log("Unpin called by:", functionName);

    if (cid === "NULL") {
      console.log("Nothing to unpin.");
      return;
    }

    const JWT = process.env.PINATA_JWT;
    const options = {
      method: "DELETE",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${JWT}`,
      },
    };

    const response = await fetch(
      `https://api.pinata.cloud/pinning/unpin/${cid}`,
      options
    );

    if (!response.ok) {
      throw new Error(`Failed to unpin: ${response.statusText}`);
    }

    console.log(`Successfully unpinned CID: ${cid}\n`);
  } catch (error) {
    console.error(
      `Failed to unpin CID ${cid}:`,
      error.message || "Unknown error"
    );
    throw error; // Re-throw to handle at caller level if needed
  }
}

module.exports = unpin;
