import {
  Tbody,
  Table,
  Thead,
  Tr,
  Th,
  Tooltip,
  Td,
  useToast,
} from "@chakra-ui/react";
import {
  ENDPOINT_TO_DATA_PROVIDER,
  MULTIPLICATION_FACTOR,
} from "../../../utils/constants/info";

export default function HistoricalTable({ ipfsHistorical, ipfsLatest }) {
  const toast = useToast();

  function urlToProvider(url) {
    if (typeof url == "string") {
      const keys = Object.keys(ENDPOINT_TO_DATA_PROVIDER);
      for (let key of keys) {
        if (url.includes(key)) {
          return ENDPOINT_TO_DATA_PROVIDER[key];
        }
      }
      return url;
    }
    return null;
  }

  function processFloatString(input) {
    const floatValue = parseFloat(input);

    if (isNaN(floatValue)) {
      return "Invalid input";
    }

    const multipliedValue = floatValue * Math.pow(10, MULTIPLICATION_FACTOR);
    const integerValue = Math.floor(multipliedValue);
    const resultString = integerValue.toString();

    return resultString;
  }

  async function handleCopy(value) {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copied Successfully",
        duration: "2000",
        status: "success",
        position: "top",
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }

  return (
    <>
      <Table p={5} bgcolor={"white"} color={"black"} borderRadius={20}>
        <Thead>
          <Tr>
            <Th>SNo</Th>
            <Tooltip label="Signature over the aggregated price.">
              <Th>Agg. Signature</Th>
            </Tooltip>
            <Tooltip label="The aggregated price after removing outliers.">
              <Th>Agg. Price</Th>
            </Tooltip>
            <Tooltip label="Timestamp when the aggregated price was calculated.">
              <Th>Agg. Timestamp</Th>
            </Tooltip>
            <Th>Provider</Th>
            <Th>Price</Th>
            <Th>Signature</Th>
            <Th>Timestamp</Th>
          </Tr>
        </Thead>
        <Tbody>
          {Array.isArray(ipfsHistorical) &&
            Array.isArray(ipfsLatest) &&
            [...ipfsLatest, ...ipfsHistorical].map((item, key) => {
              try {
                const collectivePrice = item.price;
                const collectiveSignature = item.signature.signature;
                const collectiveTimestamp = item.aggregationTimestamp;

                const urls = item.urls;
                const signatures = item.signatures;
                const prices_returned = item.prices_returned;
                const timestamps = item.timestamps;

                const limit = timestamps.length;

                return Array.from({ length: limit }).map((_, x) => (
                  <Tr key={`${key}-${x}`} fontFamily={"Manrope Variable"} p={2}>
                    <Td>{key + 1}</Td>
                    <Td
                      _hover={{ cursor: "pointer" }}
                      onClick={() => handleCopy(collectiveSignature)}
                    >
                      {collectiveSignature
                        ? collectiveSignature.slice(0, 4) +
                          "..." +
                          collectiveSignature.slice(-4)
                        : null}
                    </Td>
                    <Td>{collectivePrice}</Td>
                    <Td>{collectiveTimestamp}</Td>
                    <Td>{urlToProvider(urls[x])}</Td>
                    <Td>{processFloatString(prices_returned[x])}</Td>
                    <Td
                      _hover={{ cursor: "pointer" }}
                      onClick={() => handleCopy(signatures[x].signature)}
                    >
                      {signatures[x] && signatures[x].signature
                        ? signatures[x].signature.slice(0, 4) +
                          "..." +
                          signatures[x].signature.slice(-4)
                        : null}
                    </Td>
                    <Td>{timestamps[x]}</Td>
                  </Tr>
                ));
              } catch (err) {
                console.log();
              }
            })}
        </Tbody>
      </Table>
    </>
  );
}
