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
} from "../../../utils/constants/info";

import { SlArrowDown, SlArrowLeft } from "react-icons/sl";

import HistoricalTable from "./HistoricalTable";
import PriceGraph from "./PriceGraph";
import MarqueeDataProviders from "./MarqueeDataProviders";
import PositiveMiniChart from "./PositiveMiniChart";
import NegativeMiniChart from "./NegativeMiniChart";

export default function IndividualAsset({ token }) {
  if (!token) {
    return <div>Loading...</div>; // Or any loading indicator
  }

  const axios = require("axios");
  const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

  const [percentage, setPercentage] = useState("0.00%");
  const [net, setNet] = useState("+");
  const [graphData, setGraphData] = useState(null);
  const [graphMin, setGraphMin] = useState(null);
  const [graphMax, setGraphMax] = useState(null);

  const [latest, setLatest] = useState(null);
  const [ipfsData, setIPFSData] = useState(null);
  const [ipfsLatest, setIPFSLatest] = useState(null);
  const [ipfsHistorical, setIPFSHistorical] = useState(null);

  const toast = useToast();

  const providers = Object.keys(ENDPOINT_TO_DATA_PROVIDER);

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
  function capitalizeFirstLetter(word) {
    if (word) return word.charAt(0).toUpperCase() + word.slice(1);
    else return "";
  }
  function normalizePrice(str) {
    let num = parseInt(str);
    num = num / Math.pow(10, 10);
    num = Math.round(num * 100) / 100;
    return num;
  }

  async function getInformation() {
    try {
      const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;
      const headers = {
        Authorization: "Bearer " + key,
      };
      const response = await axios.get(
        `/api/get/getPriceInterface?token=${SYMBOL_TO_TOKEN[token]}`,
        {
          headers: headers,
        }
      );
      setLatest(response.data.information);
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  }

  async function getCID() {
    const response = await axios.get("/api/get/getLatestCID");
    const cid = response.data.cid;

    try {
      const ipfsData = await axios.get(`https://${GATEWAY}/ipfs/${cid}`);
      setIPFSData(ipfsData.data);
    } catch (err) {
      const ipfsData = await axios.get(`https://ipfs.io/ipfs/${cid}`);
      setIPFSData(ipfsData.data);
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

  useEffect(() => {
    if (ipfsData) {
      const toPush = ipfsData.latest.prices[SYMBOL_TO_TOKEN[token]];
      // toPush.timestamp = ipfsData.latest.timestamp.toString();
      const latestArr = new Array();
      latestArr.push(toPush);

      setIPFSLatest(latestArr);
      produceHistoricalForToken(ipfsData.historical);
    }
  }, [ipfsData]);

  const src = `/static/slot_token/${SYMBOL_TO_TOKEN[token]}.png`;

  function normalizePrice(str) {
    let num = parseInt(str);
    num = num / Math.pow(10, 10);
    num = Math.round(num * 100) / 100;
    return num;
  }

  function mergeAndTransformArrays(latest, historical) {
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    // Concatenate the reversed historical array with the latest array
    const combinedArray = [...historical, ...latest];

    combinedArray.forEach((item) => {
      const price = normalizePrice(item.price);
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
    });

    const firstHistoricalPrice = parseFloat(historical[0].price);
    const latestPrice = parseFloat(latest[0].price);
    const percentageChange =
      ((latestPrice - firstHistoricalPrice) / firstHistoricalPrice) * 100;
    const formattedPercentageChange =
      percentageChange >= 0
        ? `+${percentageChange.toFixed(2)}%`
        : `${percentageChange.toFixed(2)}%`;

    setPercentage(formattedPercentageChange);
    setNet(percentageChange >= 0 ? "+" : "-");

    // Map over the combined array to create a new array of objects
    const finalArray = combinedArray.map((item) => ({
      timestamp: item.aggregationTimestamp,
      price: normalizePrice(item.price),
    }));

    setGraphData(finalArray);
    setGraphMax(maxPrice);
    setGraphMin(minPrice);
  }

  useEffect(() => {
    if (ipfsLatest && ipfsHistorical) {
      mergeAndTransformArrays(ipfsLatest, ipfsHistorical);
    }
  }, [ipfsLatest, ipfsHistorical]);

  return (
    <>
      <Flex
        margin="0 auto"
        direction="column"
        gap={32}
        align="center"
        maxW="1200px"
      >
        <Flex direction={"column"} minH={"100%"} minW={"100%"}>
          <Link href="/feeds" w="fit-content" mb={10}>
            <SlArrowLeft size={"44px"} />
          </Link>
          <Heading fontSize={"3xl"} fontFamily={"Montserrat Variable"} mb={5}>
            {token} / USD
          </Heading>
          <Text mb={14} fontSize={"24px"}>
            The displayed price and data may vary due to conversion.
          </Text>
          <Flex
            h="455px"
            w="100%"
            bgColor="white"
            borderRadius="16px"
            direction="column"
            p={10}
          >
            {ipfsLatest ? (
              <>
                <Flex pb={10}>
                  <Text
                    display="inline-block"
                    textAlign="left"
                    color="black"
                    fontFamily="Montserrat Variable"
                    fontSize="30px"
                    fontWeight={500}
                  >
                    24 Hr
                  </Text>
                  <Spacer />
                  <Text
                    display="inline-block"
                    textAlign="right"
                    color="black"
                    fontFamily="Montserrat Variable"
                    fontSize="30px"
                    fontWeight={500}
                  >
                    $ {normalizePrice(ipfsLatest[0].price)}
                  </Text>
                </Flex>
              </>
            ) : null}

            {graphData && graphMax && graphMin && (
              <PriceGraph
                graphData={graphData}
                graphMax={graphMax}
                graphMin={graphMin}
              />
            )}
          </Flex>
        </Flex>
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
          <Box w="100vw">
            <MarqueeDataProviders providers={providers} />
          </Box>
        </Flex>
        <Flex
          direction="column"
          bgColor="#202020"
          h={550}
          w={930}
          p={10}
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
            {percentage && net && graphData && (
              <Box>
                {net == "+" ? (
                  <PositiveMiniChart
                    data={graphData}
                    graphMax={graphMax}
                    graphMin={graphMin}
                    percentage={percentage}
                  />
                ) : (
                  <NegativeMiniChart
                    data={graphData}
                    graphMax={graphMax}
                    graphMin={graphMin}
                    percentage={percentage}
                  />
                )}
              </Box>
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
                <Flex ml={6} w="50%" direction="column" gap={12}>
                  <Flex direction={"column"} mt={10} gap={2}>
                    <Text
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
                  <Flex direction={"column"}>
                    <Text
                      fontFamily={"Montserrat Variable"}
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
          p={10}
          gap={5}
          align="center"
          justify="center"
        >
          <Flex direction="column" w="1380px">
            <Heading textAlign="left" fontFamily={"Montserrat Variable"}>
              Historical Information
            </Heading>
            <Text pb={5} mb={5} fontSize={"sm"}>
              (The prices are precise upto the 10th decimal)
            </Text>
          </Flex>
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
    </>
  );
}
