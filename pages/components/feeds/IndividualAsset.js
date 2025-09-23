import {
  Box,
  Flex,
  Heading,
  Text,
  useToast,
  Image,
  Spacer,
  Link,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  SYMBOL_TO_TOKEN,
  ENDPOINT_TO_DATA_PROVIDER,
} from "@/utils/constants/info";

import { SlArrowDown, SlArrowLeft } from "react-icons/sl";

import PriceGraph from "./PriceGraph";
import MiniChart from "./MiniChart";
import HistoricalTable from "./HistoricalTable";
import MarqueeDataProviders from "./MarqueeDataProviders";

export default function IndividualAsset({ token }) {
  if (!token) {
    return <div>Loading...</div>; // Or any loading indicator
  }

  const arrowSize = useBreakpointValue({ base: "32px", md: "44px" });
  const axios = require("axios");
  const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

  const [direction, setDirection] = useState("+");
  const [graphData, setGraphData] = useState(null);
  const [graphMin, setGraphMin] = useState(null);
  const [graphMax, setGraphMax] = useState(null);
  const [timeframe, setTimeframe] = useState("24h");
  const [percentage, setPercentage] = useState("0.00%");

  const [latest, setLatest] = useState(null);

  const [ipfsData, setIPFSData] = useState(null);
  const [ipfsLatest, setIPFSLatest] = useState(null);
  const [ipfsHistorical, setIPFSHistorical] = useState(null);

  const toast = useToast();

  const providers = Object.keys(ENDPOINT_TO_DATA_PROVIDER);

  const src = `/static/slot_token/${SYMBOL_TO_TOKEN[token]}.png`;

  function capitalizeFirstLetter(word) {
    if (word) return word.charAt(0).toUpperCase() + word.slice(1);
    else return "";
  }

  function normalizePrice(str) {
    let num = parseFloat(str);
    num = num / Math.pow(10, 10);
    // Increase precision for small price movements
    const precision = num < 1 ? 10000 : 1000;
    num = Math.round(num * precision) / precision;
    return num;
  }

  async function produceHistoricalForToken(historicalObj) {
    const tokenHistoricalArray = [];
    const timestamps = Object.keys(historicalObj);

    for (const timestamp of timestamps) {
      const data = historicalObj[timestamp][SYMBOL_TO_TOKEN[token]];
      if (data) {
        data.timestamp = timestamp;
        tokenHistoricalArray.push(data);
      }
    }

    setIPFSHistorical(tokenHistoricalArray);
  }

  console.log(ipfsData);

  useEffect(() => {
    if (ipfsData) {
      const toPush = ipfsData.latest.prices[SYMBOL_TO_TOKEN[token]];
      const arr = new Array();
      arr.push(toPush);

      setIPFSLatest(arr);
      produceHistoricalForToken(ipfsData.historical);
    }
  }, [ipfsData]);

  async function getCID() {
    const response = await axios.get(
      "/api/get/pinned/getLatestHistoricalPinCID"
    );
    const cid = response.data.data.cid;

    try {
      const ipfsData = await axios.get(`https://${GATEWAY}/ipfs/${cid}`);
      setIPFSData(ipfsData.data);
    } catch (err) {
      const ipfsData = await axios.get(`https://ipfs.io/ipfs/${cid}`);
      setIPFSData(ipfsData.data);
    }
  }

  async function getInformation() {
    try {
      const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;
      const headers = {
        Authorization: "Bearer " + key,
      };
      const priceResponse = await axios.get(
        `/api/get/interface/getPrice?token=${SYMBOL_TO_TOKEN[token]}`,
        {
          headers: headers,
        }
      );
      const graphResponse = await axios.get(
        `/api/get/interface/getGraphData?token=${SYMBOL_TO_TOKEN[token]}`,
        {
          headers: headers,
        }
      );

      setGraphData(graphResponse.data.data.graph_data);
      setGraphMin(graphResponse.data.data.min_price);
      setGraphMax(graphResponse.data.data.max_price);
      setPercentage(graphResponse.data.data.percentage_change);
      setDirection(graphResponse.data.data.percentage_change[0]);

      setLatest(priceResponse.data.data);
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  }

  const handleCopySignature = async () => {
    try {
      await navigator.clipboard.writeText(latest.signature.signature);
      toast({
        title: "Copied Successfully",
        duration: "2000",
        status: "success",
        position: "top",
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleCopyPublicKey = async () => {
    try {
      await navigator.clipboard.writeText(latest.signature.publicKey);
      toast({
        title: "Copied Successfully",
        duration: "2000",
        status: "success",
        position: "top",
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  useEffect(() => {
    getInformation();
    getCID();
  }, []);

  return (
    <>
      <Flex
        direction="column"
        gap={32}
        align="center"
        maxW="1200px"
        w="100%"
        px={{ base: 4, md: 0 }}
        margin="0 auto"
      >
        {/* top-graph */}
        <Flex direction={"column"} minH={"100%"} minW={"100%"}>
          <Link href="/feeds" w="fit-content" mb={10}>
            <SlArrowLeft size={arrowSize} />
          </Link>
          <Heading
            fontSize={{ base: "2xl", md: "3xl" }}
            fontFamily={"Montserrat Variable"}
            mb={5}
          >
            {capitalizeFirstLetter(SYMBOL_TO_TOKEN[token])}
          </Heading>
          <Text mb={14} fontSize={{ base: "14px", md: "18px", lg: "24px" }}>
            (The displayed price and data may vary due to conversion.)
          </Text>
          <Flex
            h={{ base: "360px", md: "480px", lg: "600px" }}
            w="100%"
            bgColor="#1A1A1A"
            borderRadius="16px"
            direction="column"
            p={{ base: 4, md: 8, lg: 10 }}
            border="1px solid #333333"
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
          >
            {latest ? (
              <>
                <Flex
                  pb={{ base: 4, md: 10 }}
                  align={{ base: "flex-start", md: "center" }}
                >
                  <Text
                    display="inline-block"
                    textAlign="left"
                    color="white"
                    fontFamily="Montserrat Variable"
                    fontSize={{ base: "18px", md: "24px", lg: "30px" }}
                    fontWeight={500}
                  >
                    {timeframe === "all" ? "All" : timeframe.toUpperCase()}
                  </Text>
                  <Spacer />
                  <Text
                    display="inline-block"
                    textAlign="right"
                    color="white"
                    fontFamily="Montserrat Variable"
                    fontSize={{ base: "18px", md: "24px", lg: "30px" }}
                    fontWeight={500}
                  >
                    $ {normalizePrice(latest.price)}
                  </Text>
                </Flex>
                {/* timeframe controls */}
                <Flex gap={{ base: 1, md: 2 }} wrap="wrap" mb={4}>
                  {/* Mobile - essential timeframes */}
                  <Flex
                    gap={1}
                    wrap="wrap"
                    display={{ base: "flex", md: "none" }}
                  >
                    {["10min", "1h", "12h", "24h", "1m"].map((tf) => (
                      <Box
                        key={tf}
                        as="button"
                        onClick={() => setTimeframe(tf)}
                        px={2}
                        py={1}
                        borderRadius={6}
                        fontSize="xs"
                        color={timeframe === tf ? "white" : "#CCCCCC"}
                        bg={timeframe === tf ? "#6B1BFF" : "#333333"}
                        _hover={{
                          bg: timeframe === tf ? "#5218bd" : "#444444",
                          transition: "all 0.2s ease",
                        }}
                        transition="all 0.2s ease"
                      >
                        {tf.toUpperCase()}
                      </Box>
                    ))}
                  </Flex>
                  {/* Desktop - all timeframes */}
                  <Flex
                    gap={2}
                    wrap="wrap"
                    display={{ base: "none", md: "flex" }}
                  >
                    {[
                      "10min",
                      "30min",
                      "1h",
                      "3h",
                      "6h",
                      "12h",
                      "24h",
                      "7d",
                      "15d",
                      "1m",
                      "3m",
                      "6m",
                      "all",
                    ].map((tf) => (
                      <Box
                        key={tf}
                        as="button"
                        onClick={() => setTimeframe(tf)}
                        px={3}
                        py={1}
                        borderRadius={6}
                        fontSize="sm"
                        color={timeframe === tf ? "white" : "#CCCCCC"}
                        bg={timeframe === tf ? "#6B1BFF" : "#333333"}
                        _hover={{
                          bg: timeframe === tf ? "#5218bd" : "#444444",
                          transition: "all 0.2s ease",
                        }}
                        transition="all 0.2s ease"
                      >
                        {tf.toUpperCase()}
                      </Box>
                    ))}
                  </Flex>
                </Flex>
              </>
            ) : null}

            {graphData &&
              graphMax &&
              graphMin &&
              (() => {
                // aggregate by timeframe (replaces old filtering logic)
                const {
                  aggregateDataByTimeframe,
                  calculateAggregatedMinMax,
                  logAggregationStats
                } = require("@/utils/helper/AggregateTimeframeData");
                const {
                  getIntervalForTimeframe,
                  requiresAggregation
                } = require("@/utils/helper/TimeframeConfig");

                // Get aggregation interval for the selected timeframe
                const interval = getIntervalForTimeframe(timeframe);

                let data;
                if (interval === null || !requiresAggregation(timeframe)) {
                  // Show all data for 'all' timeframe or 10min (no aggregation)
                  data = graphData;
                } else {
                  // Aggregate data to the specified interval
                  data = aggregateDataByTimeframe(graphData, interval);

                  // Log aggregation stats in development
                  if (process.env.NODE_ENV === 'development') {
                    logAggregationStats(graphData, data, interval);
                  }
                }
                // Calculate min/max from aggregated data for accurate chart scaling
                const { min: localMin, max: localMax } = calculateAggregatedMinMax(data);

                // Fallback to original values if no aggregated data
                const finalMin = localMin > 0 ? localMin : graphMin;
                const finalMax = localMax > 0 ? localMax : graphMax;
                return (
                  <Box flex="1" h="100%" minH={{ base: "240px", md: "380px" }}>
                    {" "}
                    <PriceGraph
                      graphData={data}
                      graphMin={finalMin}
                      graphMax={finalMax}
                      timeframe={timeframe}
                    />
                  </Box>
                );
              })()}
          </Flex>
        </Flex>
        {/* providers */}
        <Flex w="70vw" direction="column" align="center">
          <Heading
            fontFamily="Montserrat Variable"
            fontSize="3xl"
            textAlign="center"
            mb={7}
            fontWeight="600"
          >
            Data Providers
          </Heading>
          <Box w="80vw">
            <MarqueeDataProviders providers={providers} />
          </Box>
        </Flex>
        {/* stats card */}
        <Flex
          direction="column"
          bgColor="#202020"
          h={{ base: "auto", md: 580 }}
          w={{ base: "100%", md: 930 }}
          p={{ base: 5, md: 10 }}
          pb={{ base: 8, md: 14 }}
          borderRadius={20}
        >
          <Flex>
            <Flex gap={5} align="center" justify="center" h={"fit-content"}>
              <Image src={src} h={37} w={37} />
              <Flex direction="column">
                <Text fontSize={{ base: "20px", md: "22px", lg: "24px" }}>
                  {capitalizeFirstLetter(SYMBOL_TO_TOKEN[token]) + "/USD"}
                </Text>
                <Text
                  fontSize={{ base: "12px", md: "14px", lg: "16px" }}
                  color="#83868E"
                >
                  Today's stats
                </Text>
              </Flex>
            </Flex>
            <Spacer />
            {percentage && direction && graphData && (
              <Flex position="relative">
                <Text
                  position={{ base: "static", sm: "absolute" }}
                  color={direction == "+" ? "green.400" : "red.400"}
                  left={{ base: "0", sm: -3 }}
                >
                  {percentage}
                </Text>
                <Box display={{ base: "none", sm: "block" }}>
                  <MiniChart
                    direction={direction}
                    data={graphData}
                    graphMax={graphMax}
                    graphMin={graphMin}
                    percentage={percentage}
                  />
                </Box>
              </Flex>
            )}
          </Flex>
          {latest ? (
            <>
              <Flex
                gap={{ base: 6, md: 10 }}
                w="100%"
                direction={{ base: "column", md: "row" }}
              >
                <Flex
                  gap={{ base: 4, md: 7 }}
                  w={{ base: "100%", md: "40%" }}
                  direction="column"
                  borderRight={{ base: "none", md: "2px solid white" }}
                >
                  <Flex direction="column" gap={2}>
                    <Text
                      fontSize={{ base: "14px", md: "16px", lg: "18px" }}
                      color="#BFBFBF"
                    >
                      Price
                    </Text>
                    <Flex gap={3} align="center">
                      <Image
                        src="/static/images/wallet.png"
                        w={"20px"}
                        h={"15px"}
                      />
                      <Text
                        fontSize={{ base: "16px", md: "18px" }}
                        fontWeight={500}
                      >
                        ${normalizePrice(latest.price)}
                      </Text>
                      <Flex align="center" gap={2}>
                        <Text
                          fontSize={{ base: "11px", md: "12px" }}
                          color="#F5F5F5"
                        >
                          USD
                        </Text>
                        <SlArrowDown size={12} />
                      </Flex>
                    </Flex>
                  </Flex>
                  <Flex direction="column" gap={2}>
                    <Text
                      color="#BFBFBF"
                      fontSize={{ base: "14px", md: "16px", lg: "18px" }}
                    >
                      Decimals
                    </Text>
                    <Text fontSize={{ base: "14px", md: "16px" }}>10</Text>
                  </Flex>
                  <Flex direction="column" gap={2}>
                    <Text
                      color="#BFBFBF"
                      fontSize={{ base: "14px", md: "16px", lg: "18px" }}
                    >
                      {" "}
                      Timestamp
                    </Text>
                    <Text fontSize={{ base: "14px", md: "16px" }}>
                      {latest.aggregationTimestamp} Epoch
                    </Text>
                  </Flex>
                  <Flex direction="column" gap={2}>
                    <Text
                      color="#BFBFBF"
                      fontSize={{ base: "14px", md: "16px", lg: "18px" }}
                    >
                      Data{" "}
                    </Text>
                    <Text fontSize={{ base: "14px", md: "16px" }}>
                      {latest.signature.data}
                    </Text>
                  </Flex>
                </Flex>
                <Flex
                  ml={{ base: 0, md: 6 }}
                  w={{ base: "100%", md: "50%" }}
                  direction="column"
                  gap={{ base: 5, md: 8 }}
                >
                  <Flex direction={"column"} gap={2}>
                    <Text
                      color="#BFBFBF"
                      fontFamily={"Montserrat Variable"}
                      fontWeight={400}
                      fontSize={{ base: "14px", md: "16px", lg: "18px" }}
                    >
                      Providers
                    </Text>
                    <Text fontSize={{ base: "14px", md: "16px" }}>
                      {latest.signatures.length} / 13
                    </Text>
                  </Flex>

                  <Flex direction={"column"} gap={2}>
                    <Text
                      color="#BFBFBF"
                      fontFamily={"Montserrat Variable"}
                      fontWeight={400}
                      fontSize={{ base: "14px", md: "16px", lg: "18px" }}
                    >
                      Signature
                    </Text>
                    <Text
                      onClick={handleCopySignature}
                      fontSize={{ base: "14px", md: "16px" }}
                      _hover={{
                        cursor: "pointer",
                      }}
                    >
                      {latest.signature.signature}
                    </Text>
                  </Flex>
                  <Flex direction={"column"} gap={2}>
                    <Text
                      fontFamily={"Montserrat Variable"}
                      color="#BFBFBF"
                      fontWeight={400}
                      fontSize={{ base: "14px", md: "16px", lg: "18px" }}
                    >
                      Oracle Public Key
                    </Text>
                    <Text
                      fontSize={{ base: "14px", md: "16px" }}
                      onClick={handleCopyPublicKey}
                      _hover={{
                        cursor: "pointer",
                      }}
                    >
                      {latest.signature.publicKey}
                    </Text>
                  </Flex>
                </Flex>{" "}
              </Flex>
            </>
          ) : null}
        </Flex>
        {/* historical */}
        <Flex
          direction={"column"}
          gap={5}
          align="center"
          justify="center"
          mb={100}
        >
          <Flex direction="column" align="center">
            <Heading
              textAlign="left"
              fontFamily={"Montserrat Variable"}
              fontSize={{ base: "xl", md: "2xl" }}
            >
              Historical Information
            </Heading>
            <Text pb={5} fontSize={{ base: "xs", md: "sm" }}>
              (The prices are precise upto the 10th decimal)
            </Text>
          </Flex>
          <Flex w="100%" direction="column" borderRadius={20}>
            {ipfsHistorical && ipfsLatest ? (
              <HistoricalTable
                ipfsLatest={ipfsLatest}
                ipfsHistorical={ipfsHistorical}
              />
            ) : (
              <Heading fontFamily={"Montserrat Variable"}> Loading... </Heading>
            )}
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
