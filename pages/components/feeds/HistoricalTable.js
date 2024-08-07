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
      <Table
        p={5}
        bgcolor={"white"}
        color={"black"}
        borderRadius={10}
        overflowY="hidden"
        border="none"
      >
        <Thead>
          <Tr bgcolor="#5218bd">
            <Th color="white">SNo</Th>
            <Tooltip label="Signature over the aggregated price.">
              <Th color="white">Agg. Signature</Th>
            </Tooltip>
            <Tooltip label="The aggregated price after removing outliers.">
              <Th color="white">Agg. Price</Th>
            </Tooltip>
            <Tooltip label="Timestamp when the aggregated price was calculated.">
              <Th color="white">Agg. Timestamp</Th>
            </Tooltip>
            <Tooltip label="Data provider called.">
              <Th color="white">Provider</Th>
            </Tooltip>
            <Tooltip label="Returned price from the data provider.">
              <Th color="white">Price</Th>
            </Tooltip>
            <Tooltip label="Signature over the response price from the data provider.">
              <Th color="white">Signature</Th>
            </Tooltip>
            <Tooltip label="Timestamp when the response was received.">
              <Th color="white"> Timestamp</Th>
            </Tooltip>
          </Tr>
        </Thead>
        <Tbody border={"none"} borderRadius={20} overflow="hidden">
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
                  <Tr key={`${key}-${x}`} p={2} borderRadius={20}>
                    <Td>{x == 0 ? key + 1 : ""}</Td>
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
                    <Td border="none">{timestamps[x]}</Td>
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
