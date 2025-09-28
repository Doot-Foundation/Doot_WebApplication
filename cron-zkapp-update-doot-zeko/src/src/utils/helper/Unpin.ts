export async function unpin(cid: string, functionName: string): Promise<void> {
  try {
    console.log("Unpin called by:", functionName);

    if (cid === "NULL") {
      console.log("Nothing to unpin.");
      return;
    }

    const JWT = process.env.PINATA_JWT;
    if (!JWT) {
      throw new Error("Missing PINATA_JWT environment variable");
    }

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

    console.log(`Successfully unpinned CID: ${cid}`);
  } catch (error) {
    console.error(
      `Failed to unpin CID ${cid}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error;
  }
}