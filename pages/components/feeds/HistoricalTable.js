import {
  Tbody,
  Table,
  Thead,
  Tr,
  Th,
  Tooltip,
  Td,
  useToast,
  Flex,
  Button,
  Text,
} from "@chakra-ui/react";
import {
  ENDPOINT_TO_DATA_PROVIDER,
  MULTIPLICATION_FACTOR,
} from "../../../utils/constants/info";

import { useMemo, useState, useEffect } from "react";

export default function HistoricalTable({ ipfsHistorical, ipfsLatest }) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const pageSize = 5; // 5 serial numbers per page
  const [showMoreCols, setShowMoreCols] = useState(false);

  // Persist toggle across navigation in the session
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("doot_table_morecols");
      if (saved !== null) setShowMoreCols(saved === "1");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("doot_table_morecols", showMoreCols ? "1" : "0");
    } catch {}
  }, [showMoreCols]);

  function urlToProvider(url) {
    if (typeof url == "string") {
      // Special cases for specific API endpoints that are not in the main mapping
      if (url.includes("gateio") || url.includes("gate.io")) {
        return "Gate.io";
      }
      if (url.includes("poloniex")) {
        return "Poloniex";
      }
      if (url.includes("btse")) {
        return "BTSE";
      }

      // Check against the main ENDPOINT_TO_DATA_PROVIDER mapping
      const keys = Object.keys(ENDPOINT_TO_DATA_PROVIDER);
      for (let key of keys) {
        if (url.includes(key)) {
          return ENDPOINT_TO_DATA_PROVIDER[key];
        }
      }

      // Fallback to hostname if mapping not found
      try {
        const u = new URL(url);
        return u.hostname.replace("www.", "");
      } catch {
        return url;
      }
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

  const groups = useMemo(() => {
    const arr = [];
    if (Array.isArray(ipfsLatest)) arr.push(...ipfsLatest);
    if (Array.isArray(ipfsHistorical)) arr.push(...ipfsHistorical);
    return arr;
  }, [ipfsHistorical, ipfsLatest]);

  const totalPages = Math.max(1, Math.ceil(groups.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageGroups = groups.slice(start, end);

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <>
      <Table
        p={5}
        bg="#202020"
        color="white"
        borderRadius={12}
        overflowY="hidden"
        border="none"
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
        sx={{
          "& td": {
            borderColor: "transparent !important",
            borderBottom: "1px solid #1A1A1A !important",
          },
          "& th": {
            borderColor: "transparent !important",
          },
        }}
      >
        <Thead>
          <Tr bg="linear-gradient(135deg, #4900d1ff 0%, #461b97ff 100%)">
            <Th color="white" fontSize={{ base: "xs", md: "sm" }}>
              SNo
            </Th>
            <Tooltip
              label="Signature over the aggregated price."
              bg="#333333"
              color="white"
              borderRadius="6px"
              fontSize="sm"
            >
              <Th
                color="white"
                display={{ base: "none", md: "table-cell" }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                Agg. Signature
              </Th>
            </Tooltip>
            <Tooltip
              label="The aggregated price after removing outliers."
              bg="#333333"
              color="white"
              borderRadius="6px"
              fontSize="sm"
            >
              <Th
                color="white"
                display={{ base: "none", md: "table-cell" }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                Agg. Price
              </Th>
            </Tooltip>
            <Tooltip
              label="Timestamp when the aggregated price was calculated."
              bg="#333333"
              color="white"
              borderRadius="6px"
              fontSize="sm"
            >
              <Th
                color="white"
                display={{ base: "none", md: "table-cell" }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                Agg. Timestamp
              </Th>
            </Tooltip>
            <Tooltip
              label="Data provider called."
              bg="#333333"
              color="white"
              borderRadius="6px"
              fontSize="sm"
            >
              <Th
                color="white"
                minW={{ base: "80px", md: "160px" }}
                w={{ base: "80px", md: "160px" }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                Provider
              </Th>
            </Tooltip>
            <Tooltip
              label="Returned price from the data provider."
              bg="#333333"
              color="white"
              borderRadius="6px"
              fontSize="sm"
            >
              <Th color="white" fontSize={{ base: "xs", md: "sm" }}>
                Price
              </Th>
            </Tooltip>
            <Tooltip
              label="Signature over the response price from the data provider."
              bg="#333333"
              color="white"
              borderRadius="6px"
              fontSize="sm"
            >
              <Th
                color="white"
                display={{ base: "none", md: "table-cell" }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                Signature
              </Th>
            </Tooltip>
            <Tooltip
              label="Timestamp when the response was received."
              bg="#333333"
              color="white"
              borderRadius="6px"
              fontSize="sm"
            >
              <Th
                color="white"
                display={{ base: "none", md: "table-cell" }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                Timestamp
              </Th>
            </Tooltip>
          </Tr>
        </Thead>
        <Tbody border={"none"} borderRadius={20} overflow="hidden">
          {pageGroups.map((item, key) => {
            try {
              const collectivePrice = item.price;
              const collectiveSignature = item.signature.signature;
              const collectiveTimestamp = item.aggregationTimestamp;

              const urls = item.urls;
              const signatures = item.signatures;
              const prices_returned = item.prices_returned;
              const timestamps = item.timestamps;

              const limit = timestamps.length;

              const rows = [];

              // Add separator row for new sections
              if (key > 0) {
                rows.push(
                  <Tr key={`separator-${start + key}`} bg="#6B1BFF" h="3px">
                    <Td colSpan={8} p={0} border="none"></Td>
                  </Tr>
                );
              }

              // Add data rows
              Array.from({ length: limit }).forEach((_, x) => {
                rows.push(
                  <Tr
                    key={`${start + key}-${x}`}
                    p={2}
                    borderRadius={20}
                    bg={x % 2 === 0 ? "#202020" : "#1F1F1F"}
                    _hover={{
                      bg: "#333333",
                      transition: "background-color 0.2s ease",
                    }}
                    transition="all 0.2s ease"
                  >
                    <Td fontSize={{ base: "xs", md: "sm" }}>
                      {x == 0 ? start + key + 1 : ""}
                    </Td>
                    <Td
                      _hover={{ cursor: "pointer" }}
                      onClick={() => handleCopy(collectiveSignature)}
                      display={{ base: "none", md: "table-cell" }}
                      fontSize={{ base: "xs", md: "sm" }}
                    >
                      {collectiveSignature
                        ? collectiveSignature.slice(0, 4) +
                          "..." +
                          collectiveSignature.slice(-4)
                        : null}
                    </Td>
                    <Td
                      display={{ base: "none", md: "table-cell" }}
                      fontSize={{ base: "xs", md: "sm" }}
                    >
                      {collectivePrice}
                    </Td>
                    <Td
                      display={{ base: "none", md: "table-cell" }}
                      fontSize={{ base: "xs", md: "sm" }}
                    >
                      {collectiveTimestamp}
                    </Td>
                    <Td
                      minW={{ base: "80px", md: "160px" }}
                      w={{ base: "80px", md: "160px" }}
                      whiteSpace="nowrap"
                      fontSize={{ base: "xs", md: "sm" }}
                    >
                      {urlToProvider(urls[x])}
                    </Td>
                    <Td fontSize={{ base: "xs", md: "sm" }}>
                      {processFloatString(prices_returned[x])}
                    </Td>
                    <Td
                      _hover={{ cursor: "pointer" }}
                      onClick={() => handleCopy(signatures[x].signature)}
                      display={{ base: "none", md: "table-cell" }}
                      fontSize={{ base: "xs", md: "sm" }}
                    >
                      {signatures[x] && signatures[x].signature
                        ? signatures[x].signature.slice(0, 4) +
                          "..." +
                          signatures[x].signature.slice(-4)
                        : null}
                    </Td>
                    <Td
                      display={{ base: "none", md: "table-cell" }}
                      fontSize={{ base: "xs", md: "sm" }}
                    >
                      {timestamps[x]}
                    </Td>
                  </Tr>
                );
              });

              return rows;
            } catch (err) {
              console.log();
            }
          })}
        </Tbody>
      </Table>
      {/* Pagination controls */}
      <Flex justify="center" align="center" mt={8} gap={3} w="100%">
        <Button
          size={{ base: "sm", md: "md" }}
          variant="outline"
          onClick={() => goTo(page - 1)}
          isDisabled={page === 1}
          bg="transparent"
          border="2px solid"
          borderColor="#6B1BFF"
          color="#6B1BFF"
          fontWeight="600"
          borderRadius="12px"
          px={{ base: 3, md: 6 }}
          py={3}
          _hover={{
            bg: "#6B1BFF",
            color: "white",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(107, 27, 255, 0.3)",
          }}
          _active={{
            transform: "translateY(0)",
          }}
          _disabled={{
            opacity: 0.4,
            cursor: "not-allowed",
            _hover: {
              bg: "transparent",
              color: "#6B1BFF",
              transform: "none",
              boxShadow: "none",
            },
          }}
          transition="all 0.2s ease"
        >
          <Text display={{ base: "none", md: "block" }}>Previous</Text>
          <Text display={{ base: "block", md: "none" }}>Prev</Text>
        </Button>

        <Flex
          align="center"
          px={{ base: 3, md: 6 }}
          py={3}
          borderRadius="12px"
          bg="rgba(107, 27, 255, 0.1)"
          border="2px solid transparent"
          minW={{ base: "60px", md: "120px" }}
          justify="center"
        >
          <Text
            fontSize={{ base: "sm", md: "md" }}
            fontWeight="600"
            color="#6B1BFF"
          >
            <Text display={{ base: "block", md: "none" }}>
              {page}/{totalPages}
            </Text>
            <Text display={{ base: "none", md: "block" }}>
              Page {page} of {totalPages}
            </Text>
          </Text>
        </Flex>

        <Button
          size={{ base: "sm", md: "md" }}
          variant="outline"
          onClick={() => goTo(page + 1)}
          isDisabled={page === totalPages}
          bg="transparent"
          border="2px solid"
          borderColor="#6B1BFF"
          color="#6B1BFF"
          fontWeight="600"
          borderRadius="12px"
          px={{ base: 3, md: 6 }}
          py={3}
          _hover={{
            bg: "#6B1BFF",
            color: "white",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(107, 27, 255, 0.3)",
          }}
          _active={{
            transform: "translateY(0)",
          }}
          _disabled={{
            opacity: 0.4,
            cursor: "not-allowed",
            _hover: {
              bg: "transparent",
              color: "#6B1BFF",
              transform: "none",
              boxShadow: "none",
            },
          }}
          transition="all 0.2s ease"
        >
          <Text display={{ base: "none", md: "block" }}>Next</Text>
          <Text display={{ base: "block", md: "none" }}>Next</Text>
        </Button>
      </Flex>
    </>
  );
}
