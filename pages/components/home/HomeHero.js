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
  const [asset, setAsset] = useState("Select asset");
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
    "Bitcoin  ",
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
      const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;
      const headers = {
        Authorization: "Bearer " + key,
      };
      const response = await axios.get(
        `/api/get/interface/getPrice?token=${asset}`,
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
      <Flex direction={"column"} gap={120}>
        {/* Opening */}
        <Flex direction={"column"} maxW={"100%"} gap={7} align={"center"}>
          <Flex
            position="relative"
            direction="column"
            align="center"
            justify="center"
            fontSize="70px"
            fontWeight={600}
          >
            <Image
              height="auto"
              m="auto"
              src={"/static/animation/dots.gif"}
              zIndex={"-1"}
              position={"absolute"}
              maxW="180%"
              filter="brightness(50%)"
            />
            <Box h={120}>
              <HeroAnimatedText />
            </Box>
            <Flex direction="column" align="center">
              <Box h={"102px"}>Oracle</Box>
              <Box>For Mina Protocol</Box>
            </Flex>
          </Flex>
          <Flex gap={20}>
            <Button
              position={"relative"}
              alignItems={"center"}
              justifyItems={"center"}
              p={"33px 54px"}
              gap={2}
              transition={"0.2s"}
              _active={{}}
              _hover={{}}
              background="#6B1BFF"
              boxShadow="0px 0px 200px #6B1BFF, inset 0px -3px 0px rgba(0, 0, 0, 0.2), inset 0px 1px 0px rgba(255, 255, 255, 0.4)"
              borderRadius="100px"
              fontSize={"20px"}
              overflow="hidden"
              onClick={() => scrollToElement("targetSection")}
            >
              <Box
                position="absolute"
                width="134px"
                height="40px"
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
                w="224px"
                h="67px"
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
                    <Image src="/static/images/stars.png" />
                    Learn More
                  </Flex>
                </Button>
              </Flex>
            </Link>
          </Flex>
          <Flex
            fontFamily="Source Code Pro Variable"
            borderRadius={100}
            backgroundColor="#202020"
            fontSize="18px"
            p="20px 50px"
            w="fit-content"
            gap={6}
            mt={3}
          >
            <Flex align="center" gap={5}>
              <MdOutlineContentCopy
                color={"gray"}
                size={22}
                onClick={copyToClipboard}
                cursor={"pointer"}
              />
              <Box border="1px solid gray" h="100%"></Box>
              <Flex gap={2}>
                <Flex>
                  <Box fontFamily={"Source Code Pro Variable"}>
                    revolutionary@zkapp
                  </Box>
                  <Text>:~$</Text>
                </Flex>
                <Text
                  color="white"
                  onClick={copyToClipboard}
                  cursor={"pointer"}
                >
                  npm install @doot-oracles/client
                </Text>
                <Box
                  fontWeight={900}
                  animation={`${blinking} 1.2s step-start infinite`}
                  display={"inline"}
                  color={"#0ce1ae"}
                >
                  _
                </Box>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        {/* Features */}
        <Features />
        {/* Testing  */}
        <section id="targetSection">
          <Flex direction={"column"} maxW="1200" margin="0 auto">
            <Flex direction={"column"} alignItems={"left"} gap={3}>
              <Flex direction={"row"} align={"center"} gap={14}>
                <Box
                  background={
                    "linear-gradient(90deg, #6c35de 0%,rgba(23,0,44,1) 100%)"
                  }
                  w={200}
                  h={5}
                />
                <Heading
                  letterSpacing={3}
                  size={"3xl"}
                  fontFamily={"Montserrat Variable"}
                >
                  TRY DOOT
                </Heading>
              </Flex>{" "}
              <Heading
                letterSpacing={3}
                size={"3xl"}
                fontFamily={"Montserrat Variable"}
              >
                DATA FEEDS
              </Heading>
            </Flex>

            <Flex direction={"row"} align={"center"} mt={50} gap={5}>
              <Flex
                background={"linear-gradient(120deg,#2c0055 0%, #5126a9 100%)"}
                direction={"column"}
                borderRadius={10}
                p={5}
                minH={450}
                w={"30%"}
                pos={"relative"}
              >
                <Text fontSize={25}>Choose the asset and run.</Text>

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
                  backgroundColor={"#00eab1"}
                  position="absolute"
                  bottom={5}
                  onClick={handleSubmit}
                  fontFamily={"Source Code Pro Variable"}
                  _hover={{
                    backgroundColor: "#00bc8f",
                  }}
                >
                  RUN REQUEST
                </Button>
              </Flex>
              {/* Result Window */}
              <Flex direction={"column"} h={450} w={"70%"}>
                <Flex gap={2} background="#5126a9" p={3} borderTopRadius={10}>
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
                  p="0 20px 20px 20px"
                  h={"100%"}
                >
                  <Flex
                    maxW={"100%"}
                    borderRadius={10}
                    backgroundColor={"#3f007a"}
                    direction={"column"}
                    w={"100%"}
                  >
                    <Flex
                      direction={"row"}
                      borderBottom={"2px solid white"}
                      p={5}
                      pt={7}
                      pl={5}
                      gap={20}
                      ml={10}
                      mr={10}
                      color={"#0ce1ae"}
                    >
                      <Box
                        w={"20%"}
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
                      p={10}
                      position="relative"
                      fontSize={"20px"}
                      fontFamily="Montserrat Variable"
                      fontWeight="500"
                      letterSpacing="1px"
                    >
                      <Box position="absolute">
                        <Fade in={mode == "res"}>
                          <Text
                            maxW={"100%"}
                            dangerouslySetInnerHTML={{
                              __html: result,
                            }}
                          ></Text>
                        </Fade>
                      </Box>
                      <Box position="absolute">
                        <Fade in={mode == "req"}>
                          <Text maxW={"100%"}>
                            {`https://doot.foundation/api/get/getPrice?token=${asset}`}
                          </Text>
                        </Fade>
                      </Box>
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
            fontSize="30px"
            textAlign="center"
          >
            Seemlessly integrate it with your next{" "}
            <b>
              <i>BIG THING&#9889; </i>
            </b>
            on the Mina Protocol and we'll be there to support you through every
            step.
          </Heading>
          <Flex
            mt={10}
            mb={20}
            w="224px"
            h="61px"
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
                <Image src="/static/images/stars.png" />
                Contact Us
              </Flex>
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
