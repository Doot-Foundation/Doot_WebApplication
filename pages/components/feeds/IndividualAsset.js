import {
  Box,
  Flex,
  Heading,
  Text,
  useToast,
  Image,
  Spacer,
  Link,
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

  const axios = require("axios");
  const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

  const [direction, setDirection] = useState("+");
  const [graphData, setGraphData] = useState(null);
  const [graphMin, setGraphMin] = useState(null);
  const [graphMax, setGraphMax] = useState(null);
  const [timeframe, setTimeframe] = useState('24h');
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
      <Flex direction="column" gap={32} align="center" w={1200} margin="0 auto">
        {/* top-graph */}
        <Flex direction={"column"} minH={"100%"} minW={"100%"}>
          <Link href="/feeds" w="fit-content" mb={10}>
            <SlArrowLeft size={"44px"} />
          </Link>
          <Heading fontSize={"3xl"} fontFamily={"Montserrat Variable"} mb={5}>
            {capitalizeFirstLetter(SYMBOL_TO_TOKEN[token])}
          </Heading>
          <Text mb={14} fontSize={"24px"}>
            (The displayed price and data may vary due to conversion.)
          </Text>
          <Flex
            h="600px"
            w="100%"
            bgColor="#1A1A1A"
            borderRadius="16px"
            direction="column"
            p={10}
            border="1px solid #333333"
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
          >
            {latest ? (
              <>
                <Flex pb={10}>
                  <Text
                    display="inline-block"
                    textAlign="left"
                    color="white"
                    fontFamily="Montserrat Variable"
                    fontSize="30px"
                    fontWeight={500}
                  >
                    {timeframe === 'all' ? 'All' : timeframe.toUpperCase()}
                  </Text>
                  <Spacer />
                  <Text
                    display="inline-block"
                    textAlign="right"
                    color="white"
                    fontFamily="Montserrat Variable"
                    fontSize="30px"
                    fontWeight={500}
                  >
                    $ {normalizePrice(latest.price)}
                  </Text>
                </Flex>
                {/* timeframe controls */}
                <Flex gap={2} wrap="wrap" mb={4}>
                  {['10m','30m','1h','3h','6h','12h','24h','7d','15d','1m','3m','6m','all'].map(tf => (
                    <Box
                      key={tf}
                      as="button"
                      onClick={() => setTimeframe(tf)}
                      px={3}
                      py={1}
                      borderRadius={6}
                      fontSize="sm"
                      color={timeframe===tf? 'white':'#CCCCCC'}
                      bg={timeframe===tf? '#6B1BFF': '#333333'}
                      _hover={{
                        bg: timeframe===tf? '#5218bd': '#444444',
                        transition: 'all 0.2s ease'
                      }}
                      transition="all 0.2s ease"
                    >
                      {tf.toUpperCase()}
                    </Box>
                  ))}
                </Flex>
              </>
            ) : null}

            {graphData && graphMax && graphMin && (
              (() => {
                // filter by timeframe
                const now = Date.now();
                const ranges = {
                  '10m': 10*60*1000,
                  '30m': 30*60*1000,
                  '1h': 60*60*1000,
                  '3h': 3*60*60*1000,
                  '6h': 6*60*60*1000,
                  '12h': 12*60*60*1000,
                  '24h': 24*60*60*1000,
                  '7d': 7*24*60*60*1000,
                  '15d': 15*24*60*60*1000,
                  '1m': 30*24*60*60*1000,
                  '3m': 90*24*60*60*1000,
                  '6m': 180*24*60*60*1000,
                };
                const data = timeframe==='all' ? graphData : graphData.filter(p => {
                  const tsMs = Number(p.timestamp)*1000;
                  return isFinite(tsMs) && (now - tsMs) <= (ranges[timeframe] || ranges['24h']);
                });
                const ys = data.map(d=>d.price);
                const localMin = ys.length ? Math.min(...ys) : graphMin;
                const localMax = ys.length ? Math.max(...ys) : graphMax;
                return (
                  <Box flex="1" h="400px">
                    <PriceGraph
                      graphData={data}
                      graphMin={localMin}
                      graphMax={localMax}
                      timeframe={timeframe}
                    />
                  </Box>
                );
              })()
            )}
          </Flex>
        </Flex>
        {/* providers */}
        <Flex w="100%" direction="column" align="center">
          <Heading
            fontFamily="Montserrat Variable"
            fontSize="3xl"
            textAlign="center"
            mb={7}
            fontWeight="600"
          >
            Data Providers
          </Heading>
          <Box w="100%">
            <MarqueeDataProviders providers={providers} />
          </Box>
        </Flex>
        {/* stats card */}
        <Flex
          direction="column"
          bgColor="#202020"
          h={580}
          w={930}
          p={10}
          pb={14}
          borderRadius={20}
        >
          <Flex>
            <Flex gap={5} align="center" justify="center" h={"fit-content"}>
              <Image src={src} h={37} w={37} />
              <Flex direction="column">
                <Text fontSize="24px">
                  {capitalizeFirstLetter(SYMBOL_TO_TOKEN[token]) + "/USD"}
                </Text>
                <Text fontSize="16px" color="#83868E">
                  Today's stats
                </Text>
              </Flex>
            </Flex>
            <Spacer />
            {percentage && direction && graphData && (
              <Flex position="relative">
                <Text
                  position="absolute"
                  color={direction == "+" ? "green.400" : "red.400"}
                  left={-3}
                >
                  {percentage}
                </Text>
                <MiniChart
                  direction={direction}
                  data={graphData}
                  graphMax={graphMax}
                  graphMin={graphMin}
                  percentage={percentage}
                />
              </Flex>
            )}
          </Flex>
          {latest ? (
            <>
              <Flex gap={10} w="100%">
                <Flex
                  gap={7}
                  w="40%"
                  direction="column"
                  borderRight="2px solid white  "
                >
                  <Flex direction="column" gap={2}>
                    <Text fontSize="18px" color="#BFBFBF">
                      Price
                    </Text>
                    <Flex gap={3} align="center">
                      <Image
                        src="/static/images/wallet.png"
                        w={"20px"}
                        h={"15px"}
                      />
                      <Text fontSize="18px" fontWeight={500}>
                        ${normalizePrice(latest.price)}
                      </Text>
                      <Flex align="center" gap={2}>
                        <Text fontSize="12px" color="#F5F5F5">
                          USD
                        </Text>
                        <SlArrowDown size={12} />
                      </Flex>
                    </Flex>
                  </Flex>
                  <Flex direction="column" gap={2}>
                    <Text color="#BFBFBF" fontSize="18px">
                      Decimals
                    </Text>
                    <Text fontSize="16px">10</Text>
                  </Flex>
                  <Flex direction="column" gap={2}>
                    <Text color="#BFBFBF" fontSize="18px">
                      {" "}
                      Timestamp
                    </Text>
                    <Text fontSize="16px">
                      {latest.aggregationTimestamp} Epoch
                    </Text>
                  </Flex>
                  <Flex direction="column" gap={2}>
                    <Text color="#BFBFBF" fontSize="18px">
                      Data{" "}
                    </Text>
                    <Text fontSize="16px">{latest.signature.data}</Text>
                  </Flex>
                </Flex>
                <Flex ml={6} w="50%" direction="column" gap={8}>
                  <Flex direction={"column"} gap={2}>
                    <Text
                      color="#BFBFBF"
                      fontFamily={"Montserrat Variable"}
                      fontWeight={400}
                      fontSize="18px"
                    >
                      Providers
                    </Text>
                    <Text fontSize={"16px"}>
                      {latest.signatures.length} / 13
                    </Text>
                  </Flex>

                  <Flex direction={"column"} gap={2}>
                    <Text
                      color="#BFBFBF"
                      fontFamily={"Montserrat Variable"}
                      fontWeight={400}
                      fontSize="18px"
                    >
                      Signature
                    </Text>
                    <Text
                      onClick={handleCopySignature}
                      fontSize={"16px"}
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
                      fontSize="18px"
                    >
                      Oracle Public Key
                    </Text>
                    <Text
                      fontSize="16px"
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
            <Heading textAlign="left" fontFamily={"Montserrat Variable"}>
              Historical Information
            </Heading>
            <Text pb={5} fontSize={"sm"}>
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
