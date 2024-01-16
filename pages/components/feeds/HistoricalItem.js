import { Td, Tr, Box } from "@chakra-ui/react";
import { ENDPOINT_TO_DATA_PROVIDER } from "../../../utils/constants/info";

export default function HistoricalItem({ item, index }) {
  const collectivePrice = item.price;
  const collectiveSignature = item.signature.signature;
  const collectiveTimestamp = item.timestamp;

  const urls = item.urls;
  const signatures = item.signatures;
  const prices_returned = item.prices_returned;
  const timestamps = item.timestamps;

  const limit = timestamps.length;

  function urlToProvider(url) {
    const keys = Object.keys(ENDPOINT_TO_DATA_PROVIDER);
    for (let key of keys) {
      if (url.includes(key)) {
        return ENDPOINT_TO_DATA_PROVIDER[key];
      }
    }
    return url;
  }

  const items = [];
  for (let x = 0; x < limit; x++) {
    items.push(
      <>
        <Tr fontFamily={"Manrope Variable"} p={2}>
          <Td>{index + 1}</Td>
          <Td>
            {collectiveSignature.slice(0, 4) +
              "..." +
              collectiveSignature.slice(-4)}
          </Td>
          <Td>{collectivePrice}</Td>
          <Td>{collectiveTimestamp}</Td>
          <Td>{urlToProvider(urls[x])}</Td>
          <Td>{prices_returned[x]}</Td>
          <Td>
            {signatures[x]["signature"].slice(0, 4) +
              "..." +
              signatures[x]["signature"].slice(-4)}
          </Td>
          <Td>{timestamps[x]}</Td>
        </Tr>
      </>
    );
  }

  return <>{items ? items : null}</>;
}
