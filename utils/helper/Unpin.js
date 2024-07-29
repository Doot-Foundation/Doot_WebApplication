const JWT = process.env.PINATA_JWT;

async function unpin(cid, functionName) {
  console.log("Unpin called by :", functionName);
  if (cid != "NULL") {
    try {
      const options = {
        method: "DELETE",
        headers: { accept: "application/json", authorization: `Bearer ${JWT}` },
      };
      const deleteResponse = await fetch(
        `https://api.pinata.cloud/pinning/unpin/${cid}`,
        options
      );
      console.log(deleteResponse.statusText);
      console.log(`SUCCESS DELETE PIN : ${cid}\n`);
    } catch (error) {
      console.log(`ERROR DELETE PIN : ${cid}`);
      console.log(error);
    }
  } else console.log("Nothing to unpin.");
}

module.exports = unpin;
