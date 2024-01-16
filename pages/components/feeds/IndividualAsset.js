import {
  Box,
  Flex,
  Heading,
  Text,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Wrap,
  Tooltip,
  Image,
  Spacer,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  SYMBOL_TO_TOKEN,
  ENDPOINT_TO_DATA_PROVIDER,
} from "../../../utils/constants/info";
import HistoricalItem from "./HistoricalItem";

export default function IndividualAsset({ token }) {
  const axios = require("axios");
  const [latest, setLatest] = useState(null);
  const [ipfsData, setIPFSData] = useState(null);
  const [ipfsHistorical, setIPFSHistorical] = useState(null);

  const toast = useToast();

  const providers = Object.keys(ENDPOINT_TO_DATA_PROVIDER);

  async function produceHistoricalForToken(historicalObj) {
    const tokenHistoricalArray = [];
    const timestamps = Object.keys(historicalObj);

    for (const timestamp of timestamps) {
      const data = historicalObj[timestamp][SYMBOL_TO_TOKEN[token]];
      data.timestamp = timestamp;
      tokenHistoricalArray.push(data);
    }

    setIPFSHistorical(tokenHistoricalArray);
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
    const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

    const response = await axios.get("/api/get/getLatestCID");
    const cid = response.data.cid;

    const ipfsData = await axios.get(`https://${GATEWAY}/ipfs/${cid}`);

    setIPFSData(ipfsData.data);
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
      console.log(ipfsData);

      produceHistoricalForToken(ipfsData.historical);
    }
  }, [ipfsData]);

  return (
    <>
      <Flex direction={"column"} pl={20} minH={"100%"} minW={"100%"} pr={20}>
        <Heading fontSize={"6xl"} fontFamily={"Montserrat Variable"}>
          {token} / USD
        </Heading>
        <Text mb={5} fontSize={"sm"}>
          (Disclaimer : The Price Displayed And The Data Are Different Because
          Of Conversion)
        </Text>
        <Flex direction={"row"} mb={100} gap={10}>
          <Flex
            direction={"column"}
            background={
              "linear-gradient(325deg, rgba(96,46,198,1) 0%, rgba(14,0,43,1) 100%)"
            }
            borderRadius={5}
            w={"30%"}
            p={10}
            gap={10}
            boxShadow="10px 10px 2px #6c35de"
          >
            {latest ? (
              <>
                <Flex direction={"column"} gap={5}>
                  <Flex direction={"column"}>
                    <Text fontFamily={"Montserrat Variable"} fontWeight={400}>
                      Price
                    </Text>
                    <Heading fontFamily={"Manrope Variable"} size={"2xl"}>
                      ${normalizePrice(latest.price)}
                    </Heading>
                    <Box w="100%" borderBottom={"1px dashed gray"} mt={3} />
                  </Flex>
                  <Flex>
                    <Flex direction={"column"}>
                      <Text fontFamily={"Montserrat Variable"} fontWeight={400}>
                        Providers
                      </Text>
                      <Heading fontFamily={"Manrope Variable"} size={"lg"}>
                        {latest.urls.length}/11
                      </Heading>
                    </Flex>
                    <Spacer />
                    <Flex direction={"column"}>
                      <Text fontFamily={"Montserrat Variable"} fontWeight={400}>
                        Asset Type{" "}
                      </Text>
                      <Heading fontFamily={"Manrope Variable"} size={"lg"}>
                        Crypto
                      </Heading>
                    </Flex>
                  </Flex>
                  <Box w="100%" borderBottom={"1px dashed gray"} />
                  <Flex direction={"column"}>
                    <Text fontFamily={"Montserrat Variable"} fontWeight={400}>
                      Signature
                    </Text>
                    <Text
                      onClick={handleCopySignature}
                      fontFamily={"Manrope Variable"}
                      fontWeight={800}
                      _hover={{
                        cursor: "pointer",
                      }}
                    >
                      {latest.signature.signature}
                    </Text>
                    <Box w="100%" borderBottom={"1px dashed gray"} mt={3} />
                  </Flex>
                  <Flex direction={"column"}>
                    <Text fontFamily={"Montserrat Variable"} fontWeight={400}>
                      Data
                    </Text>
                    <Text
                      onClick={handleCopyPublicKey}
                      fontFamily={"Manrope Variable"}
                      fontWeight={800}
                      _hover={{
                        cursor: "pointer",
                      }}
                    >
                      {latest.signature.data}
                    </Text>
                    <Box w="100%" borderBottom={"1px dashed gray"} mt={3} />
                  </Flex>
                  <Flex direction={"column"}>
                    <Text fontFamily={"Montserrat Variable"} fontWeight={400}>
                      Oracle Public Key
                    </Text>
                    <Text
                      onClick={handleCopyPublicKey}
                      fontFamily={"Manrope Variable"}
                      fontWeight={800}
                      _hover={{
                        cursor: "pointer",
                      }}
                    >
                      {latest.signature.publicKey}
                    </Text>
                    <Box w="100%" borderBottom={"1px dashed gray"} mt={3} />
                  </Flex>
                </Flex>
              </>
            ) : null}
          </Flex>
          <Flex
            direction={"column"}
            background={
              "linear-gradient(455deg, rgba(96,46,198,1) 0%, rgba(14,0,43,1) 100%)"
            }
            boxShadow="10px 10px 2px #6c35de"
            borderRadius={5}
            p={10}
            gap={10}
            w={"100%"}
          >
            <Text fontFamily={"Montserrat Variable"} fontWeight={600}>
              Data Providers
            </Text>

            <Wrap spacing={10} justify={"center"} align={"center"}>
              {providers.map((provider, index) => {
                return (
                  <Image
                    bgColor={"white"}
                    p={5}
                    borderRadius={10}
                    src={`/static/data_providers/${provider}.png`}
                    boxSize={28}
                  />
                );
              })}
            </Wrap>
          </Flex>
        </Flex>
      </Flex>
      {/* historical */}
      <Flex
        direction={"column"}
        bg={`linear-gradient(0deg, rgba(5,3,0,1) 0%, rgba(45,0,88,1) 100%)`}
        borderRadius={5}
        minH={400}
        w={"100%"}
        p={10}
        gap={5}
      >
        <Heading fontFamily={"Montserrat Variable"}>
          Historical Information
        </Heading>
        <Text pb={5} mb={5} fontSize={"sm"}>
          (The prices are considered upto the 10th decimal)
        </Text>
        <Table
          variant="simple"
          p={5}
          bgcolor={"white"}
          color={"black"}
          borderRadius={20}
        >
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
            {ipfsHistorical &&
              ipfsHistorical.map((item, key) => {
                return (
                  <>
                    <HistoricalItem key={key} index={key} item={item} />
                    <Box mb={5}></Box>
                  </>
                );
              })}
          </Tbody>
        </Table>
      </Flex>
    </>
  );
}
