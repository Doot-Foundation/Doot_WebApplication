import {
  Flex,
  Box,
  Heading,
  Text,
  Button,
  FormControl,
  Link,
  Image,
  useToast,
  Fade,
} from "@chakra-ui/react";

import { useState } from "react";

import { keyframes } from "@emotion/react";

import { MdOutlineContentCopy } from "react-icons/md";
import HeroAnimatedText from "./HeroAnimatedText";

import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
} from "@choc-ui/chakra-autocomplete";

import axios from "axios";

import Features from "./Features";

export default function HomeHero() {
  const [asset, setAsset] = useState("");
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("res");

  const toast = useToast();

  const spin = keyframes`
  to { transform: rotate(360deg); }
 `;

  const blinking = keyframes`
  50% {
    opacity: 0;
  }
  `;

  function sendEmail() {
    window.location.href = "mailto:contact@doot.foundation";
  }

  const assets = [
    "Mina",
    "Ethereum",
    "Bitcoin",
    "Chainlink",
    "Solana",
    "Ripple",
    "Cardano",
    "Avalanche",
    "Polygon",
    "Dogecoin",
  ];

  function formatSign(sign) {
    return sign.slice(0, 10) + "......." + sign.slice(-10);
  }

  const handleSubmit = async () => {
    try {
      const selected = (asset || "").trim();
      if (!selected) {
        toast({
          title: "Please select an asset",
          status: "warning",
          duration: 2000,
        });
        return;
      }
      const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;
      const headers = {
        Authorization: "Bearer " + key,
      };
      const response = await axios.get(
        `/api/get/interface/getPrice?token=${selected}`,
        {
          headers: headers,
        }
      );
      console.log(response.data);
      const finalObj = {
        asset: response.data.asset,
        price: response.data.data.price,
        decimals: 10,
        timestamp: response.data.data.aggregationTimestamp,
        signature: formatSign(response.data.data.signature.signature),
      };

      const finalString = await formatString(finalObj);
      setResult(finalString);
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  };

  async function formatString(obj) {
    if (obj == null || obj == undefined) return "";

    var formattedString = "";
    formattedString += `<span style='color:yellow;'>{</span><br>`;

    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      formattedString += `&nbsp;&nbsp;&nbsp;&nbsp;${key} : <span style='color:orange;'>${value}</span>,<br>`;
    });
    formattedString += `<span style='color:yellow;'>}</span>`;

    return formattedString;
  }

  const scrollToElement = (elementId) => {
    const element = document.getElementById(elementId);
    element?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText("npm install @doot-oracles/client");
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

  return (
    <>
      <Flex direction={"column"} gap={{ base: 14, md: 20, lg: 120 }}>
        {/* Opening */}
        <Flex
          direction={"column"}
          maxW={"100%"}
          gap={{ base: 6, md: 8, lg: 7 }}
          align={"center"}
          px={{ base: 4, md: 8, lg: 0 }}
          position="relative"
        >
          <Image
            alt="bg animation"
            height="auto"
            m="auto"
            src={"/static/animation/dots.gif"}
            zIndex={"-1"}
            position={"absolute"}
            top={{ md: "-275px", lg: "-212px" }}
            left="50%"
            transform="translateX(-50%)"
            maxW={{ base: "180%", md: "160%", lg: "180%" }}
            filter="brightness(50%)"
            pointerEvents="none"
            display={{ base: "none", md: "block" }}
          />
          <Flex
            direction="column"
            align="center"
            justify="center"
            fontSize={{ base: "36px", md: "48px", lg: "70px" }}
            fontWeight={600}
          >
            <Box
              h={{ base: "72px", md: "96px", lg: "120px" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <HeroAnimatedText />
            </Box>
            <Flex
              direction="column"
              align="center"
              lineHeight={1.1}
              mt={{ base: "5px", sm: "20px", md: 0 }}
            >
              <Box
                as="span"
                fontSize={{ base: "28px", md: "36px", lg: "56px" }}
                fontWeight={700}
                whiteSpace="nowrap"
              >
                Oracle
              </Box>
              <Box
                as="span"
                fontSize={{ base: "28px", md: "36px", lg: "56px" }}
                fontWeight={700}
                whiteSpace="nowrap"
              >
                For Mina Protocol
              </Box>
            </Flex>
          </Flex>
          <Flex
            gap={{ base: 4, md: 6, lg: 20 }}
            direction={{ base: "column", md: "row" }}
            align="center"
          >
            <Button
              position={"relative"}
              alignItems={"center"}
              justifyItems={"center"}
              p={{ base: "20px 28px", md: "24px 36px", lg: "33px 54px" }}
              gap={2}
              transition={"0.2s"}
              _active={{}}
              _hover={{}}
              background="#6B1BFF"
              boxShadow="0px 0px 200px #6B1BFF, inset 0px -3px 0px rgba(0, 0, 0, 0.2), inset 0px 1px 0px rgba(255, 255, 255, 0.4)"
              borderRadius="100px"
              fontSize={{ base: "18px", md: "19px", lg: "20px" }}
              overflow="hidden"
              onClick={() => scrollToElement("targetSection")}
            >
              <Box
                position="absolute"
                width={{ base: "100px", md: "120px", lg: "134px" }}
                height={{ base: "32px", md: "36px", lg: "40px" }}
                left="calc(50% - 134px/2)"
                top="calc(50% - 40px/2 + 39.95px)"
                background="#9470DD"
                filter="blur(13px)"
              />

              <Image src="/static/images/stars.png" alt="Stars" />
              <Text color="white" fontWeight={"700"}>
                Try Doot
              </Text>
            </Button>

            <Link
              href="https://docs.doot.foundation/"
              target="_blank"
              _hover={{}}
            >
              <Flex
                w={{ base: "200px", md: "210px", lg: "224px" }}
                h={{ base: "56px", md: "62px", lg: "67px" }}
                position="relative"
                p="4px 2px"
                justify="center"
                align="center"
                borderRadius="100px"
                overflow="hidden"
              >
                <Box
                  position="absolute"
                  h={"600%"}
                  w={"150%"}
                  backgroundImage="linear-gradient(228.09deg, #5E5EE5 -9.95%, rgba(129, 129, 222, 0.8) 12.47%, rgba(94, 94, 229, 0.62) 30.87%, rgba(28, 25, 26, 0.89) 53.87%, rgba(68, 220, 183, 0.65) 70.34%, #00EAB1 100.44%)"
                  animation={`${spin} 3s infinite linear`}
                />
                <Button
                  borderRadius="100px"
                  _hover={{}}
                  _active={{}}
                  bgColor="#171717"
                  color="white"
                  h="100%"
                  w="100%"
                  fontFamily={"Poppins"}
                  onClick={sendEmail}
                >
                  <Flex gap={2} justify="center" align="center">
                    <Image src="/static/images/stars.png" alt="Stars" />
                    Learn More
                  </Flex>
                </Button>
              </Flex>
            </Link>
          </Flex>
          <Flex
            fontFamily="Source Code Pro Variable"
            borderRadius={24}
            backgroundColor="#202020"
            fontSize={{ base: "12px", md: "13px", lg: "16px" }}
            px={{ base: 3, md: 5, lg: 6 }}
            py={{ base: 2, md: 2.5, lg: 3 }}
            w={{ base: "100%", md: "fit-content" }}
            maxW={{ base: "600px", md: "700px", lg: "unset" }}
            mt={{ base: 2, md: 4, lg: 3 }}
            alignSelf="center"
          >
            <Flex align="center" w="100%" gap={3} justify="space-between">
              <Flex gap={2} overflowX="auto" whiteSpace="nowrap" flex="1">
                <Text color="gray.400">revolutionary@zkapp</Text>
                <Text color="gray.400">:~$</Text>
                <Text color="white">npm install @doot-oracles/client</Text>
                <Box
                  fontWeight={900}
                  animation={`${blinking} 1.2s step-start infinite`}
                  display="inline"
                  color={"#0ce1ae"}
                >
                  _
                </Box>
              </Flex>
              <MdOutlineContentCopy
                color={"gray"}
                size={18}
                onClick={copyToClipboard}
                cursor={"pointer"}
              />
            </Flex>
          </Flex>
        </Flex>
        {/* Features */}
        <Features />
        {/* Testing  */}
        <section id="targetSection">
          <Flex
            direction={"column"}
            maxW="1200px"
            w="100%"
            px={{ base: 4, md: 0 }}
            margin="0 auto"
          >
            <Flex direction={"column"} alignItems={"left"} gap={3}>
              <Flex
                direction={{ base: "column", md: "row" }}
                align={{ base: "flex-start", md: "center" }}
                gap={{ base: 4, md: 14 }}
              >
                <Box
                  background={
                    "linear-gradient(90deg, #6c35de 0%,rgba(23,0,44,1) 100%)"
                  }
                  w={{ base: 120, md: 200 }}
                  h={{ base: 3, md: 5 }}
                />
                <Heading
                  letterSpacing={3}
                  size={{ base: "xl", md: "3xl" }}
                  fontFamily={"Montserrat Variable"}
                >
                  TRY DOOT
                </Heading>
              </Flex>{" "}
              <Heading
                letterSpacing={3}
                size={{ base: "2xl", md: "3xl" }}
                fontFamily={"Montserrat Variable"}
              >
                DATA FEEDS
              </Heading>
            </Flex>

            <Flex
              direction={{ base: "column", lg: "row" }}
              align={"stretch"}
              mt={{ base: 6, md: 8, lg: 12 }}
              gap={{ base: 6, md: 6, lg: 5 }}
            >
              <Flex
                background={"linear-gradient(120deg,#2c0055 0%, #5126a9 100%)"}
                direction={"column"}
                borderRadius={10}
                p={{ base: 4, md: 5 }}
                minH={{ base: "auto", md: 450 }}
                w={{ base: "100%", lg: "30%" }}
                pos={"relative"}
              >
                <Text fontSize={{ base: 18, md: 22 }}>
                  Choose the asset and run.
                </Text>

                <FormControl
                  fontFamily={"Source Code Pro Variable"}
                  mt={5}
                  position={"relative"}
                >
                  <AutoComplete
                    openOnFocus
                    value={asset}
                    onChange={(e) => setAsset(e)}
                  >
                    <Box
                      position={"absolute"}
                      top={0}
                      left={0}
                      borderRadius={10}
                      backgroundColor={"white"}
                      h={10}
                      w={"100%"}
                    ></Box>
                    <AutoCompleteInput
                      id={1}
                      w={"100%"}
                      variant="filled"
                      placeholder="Select Asset"
                      color={"black"}
                    />
                    <AutoCompleteList>
                      {assets.map((asset, cid) => (
                        <AutoCompleteItem
                          key={`option-${cid}`}
                          value={asset}
                          color={"black"}
                          textTransform="capitalize"
                        >
                          {asset}
                        </AutoCompleteItem>
                      ))}
                    </AutoCompleteList>
                  </AutoComplete>
                </FormControl>

                <Button
                  backgroundColor={
                    !asset || asset.trim() === "" ? "#4a5568" : "#00eab1"
                  }
                  position={{ base: "static", md: "absolute" }}
                  bottom={{ base: undefined, md: 5 }}
                  mt={{ base: 4, md: 0 }}
                  onClick={handleSubmit}
                  isDisabled={!asset || asset.trim() === ""}
                  fontFamily={"Source Code Pro Variable"}
                  _hover={{
                    backgroundColor:
                      !asset || asset.trim() === "" ? "#4a5568" : "#00c99aff",
                  }}
                  _disabled={{
                    backgroundColor: "#4a5568",
                    color: "#a0a0a0",
                    cursor: "not-allowed",
                    _hover: {
                      backgroundColor: "#4a5568",
                    },
                  }}
                >
                  RUN REQUEST
                </Button>
              </Flex>
              {/* Result Window */}
              <Flex
                direction={"column"}
                h={{ base: "auto", md: 450 }}
                w={{ base: "100%", lg: "70%" }}
              >
                <Flex
                  gap={2}
                  background="#5126a9"
                  p={{ base: 2, md: 3 }}
                  borderTopRadius={10}
                >
                  <Box
                    borderRadius={"50%"}
                    boxSize={3}
                    backgroundColor={"green.300"}
                  ></Box>
                  <Box
                    borderRadius={"50%"}
                    boxSize={3}
                    backgroundColor={"orange"}
                  ></Box>
                  <Box
                    borderRadius={"50%"}
                    boxSize={3}
                    backgroundColor={"red"}
                  ></Box>
                </Flex>

                <Flex
                  backgroundColor="#2c0055"
                  borderBottomRadius={10}
                  p={{ base: "0 12px 12px 12px", md: "0 20px 20px 20px" }}
                  h={{ base: "auto", md: "100%" }}
                >
                  <Flex
                    maxW={"100%"}
                    borderRadius={10}
                    backgroundColor={"#3f007a"}
                    direction={"column"}
                    w={"100%"}
                  >
                    <Flex
                      direction={{ base: "column", md: "row" }}
                      borderBottom={"2px solid white"}
                      p={{ base: 3, md: 5 }}
                      pt={{ base: 4, md: 7 }}
                      pl={{ base: 3, md: 5 }}
                      gap={{ base: 6, md: 20 }}
                      ml={{ base: 4, md: 10 }}
                      mr={{ base: 4, md: 10 }}
                      color={"#0ce1ae"}
                    >
                      <Box
                        w={{ base: "100%", md: "20%" }}
                        cursor={"pointer"}
                        onClick={() => {
                          setMode("res");
                        }}
                        transition="0.1s linear"
                        fontWeight={mode == "res" ? 700 : 500}
                      >
                        RESPONSE
                      </Box>
                      <Box
                        cursor={"pointer"}
                        onClick={() => {
                          setMode("req");
                        }}
                        transition="0.1s linear"
                        fontWeight={mode == "req" ? 700 : 500}
                      >
                        API ENDPOINT
                      </Box>
                    </Flex>
                    <Flex
                      p={{ base: 4, md: 10 }}
                      fontSize={{ base: "12px", md: "18px", lg: "18.5px" }}
                      fontFamily="Montserrat Variable"
                      fontWeight="500"
                      letterSpacing="1px"
                    >
                      {mode === "res" ? (
                        <Fade in>
                          <Text
                            maxW={"100%"}
                            dangerouslySetInnerHTML={{
                              __html:
                                result ||
                                `<span style='color:yellow;'>{</span><br>&nbsp;&nbsp;&nbsp;&nbsp;asset : <span style='color:orange;'>mina</span>,<br>&nbsp;&nbsp;&nbsp;&nbsp;price : <span style='color:orange;'>1817306348</span>,<br>&nbsp;&nbsp;&nbsp;&nbsp;decimals : <span style='color:orange;'>10</span>,<br>&nbsp;&nbsp;&nbsp;&nbsp;timestamp : <span style='color:orange;'>${Math.floor(
                                  Date.now() / 1000
                                )}</span>,<br>&nbsp;&nbsp;&nbsp;&nbsp;signature : <span style='color:orange;'>7mXWHULiEs.......4dykprFJoW</span>,<br><span style='color:yellow;'>}</span>`,
                            }}
                          />
                        </Fade>
                      ) : (
                        <Fade in>
                          <Text
                            maxW={"100%"}
                            whiteSpace="normal"
                            overflowWrap="anywhere"
                            wordBreak="break-word"
                          >
                            {`https://doot.foundation/api/get/getPrice?token=${asset}`}
                          </Text>
                        </Fade>
                      )}
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </section>
        <Flex
          direction={"column"}
          align={"center"}
          gap={5}
          mt={20}
          justify="center"
        >
          <Heading fontFamily={"Montserrat Variable"} textAlign={"center"}>
            Begin your journey with
            <Box color="#6B1BFF" display="inline-block" ml={2} mr={2}>
              {" "}
              Doot{" "}
            </Box>
            today.
          </Heading>
          <Heading
            maxW="1200px"
            fontFamily={"Montserrat Variable"}
            fontSize={{ base: "18px", md: "20px", lg: "30px" }}
            textAlign="center"
            px={{ base: 4, md: 8, lg: 0 }}
          >
            Seemlessly integrate it with your next{" "}
            <b>
              <i>BIG THING&#9889; </i>
            </b>
            on the Mina Protocol and we&apos;ll be there to support you through
            every step.
          </Heading>
          <Flex
            mt={{ base: 6, md: 8, lg: 10 }}
            mb={{ base: 10, md: 16, lg: 20 }}
            w={{ base: "200px", md: "210px", lg: "224px" }}
            h={{ base: "52px", md: "58px", lg: "61px" }}
            position="relative"
            p="4px 2px"
            justify="center"
            align="center"
            borderRadius="100px"
            overflow="hidden"
          >
            <Box
              position="absolute"
              h={"600%"}
              w={"150%"}
              backgroundImage="linear-gradient(228.09deg, #5E5EE5 -9.95%, rgba(129, 129, 222, 0.8) 12.47%, rgba(94, 94, 229, 0.62) 30.87%, rgba(28, 25, 26, 0.89) 53.87%, rgba(68, 220, 183, 0.65) 70.34%, #00EAB1 100.44%)"
              animation={`${spin} 3s infinite linear`}
            />
            <Button
              borderRadius="100px"
              _hover={{}}
              _active={{}}
              bgColor="#171717"
              color="white"
              h="100%"
              w="100%"
              fontFamily={"Poppins"}
              onClick={sendEmail}
            >
              <Flex gap={1} justify="center" align="center">
                <Image src="/static/images/stars.png" alt="Stars" />
                Contact Us
              </Flex>
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
