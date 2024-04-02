import {
  Spacer,
  Flex,
  Box,
  Heading,
  Text,
  Button,
  FormControl,
  Link,
} from "@chakra-ui/react";

import { keyframes } from "@emotion/react";

import axios from "axios";

import { useState } from "react";

import { GiAllSeeingEye } from "react-icons/gi";
import { MdOutlineJoinInner } from "react-icons/md";
import { MdOutlineCleaningServices } from "react-icons/md";
import { FaArrowRightLong } from "react-icons/fa6";
import { GoVerified } from "react-icons/go";
import { LuPartyPopper } from "react-icons/lu";

import InformationCard from "./InformationCard";

import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
} from "@choc-ui/chakra-autocomplete";

export default function HomeHero() {
  const [asset, setAsset] = useState("Select asset");
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("res");

  const blinking = keyframes`
  50% {
    opacity: 0;
  }
  `;
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

  const handleSubmit = async () => {
    try {
      const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;
      const headers = {
        Authorization: "Bearer " + key,
      };
      const response = await axios.get(
        `/api/get/getPriceInterface?token=${asset}`,
        {
          headers: headers,
        }
      );
      const finalObj = {
        asset: response.data.asset,
        price: response.data.information.price,
        decimals: 10,
        timestamp: response.data.timestamp,
      };

      const finalString = await formatString(finalObj);
      setResult(finalString);
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  };

  // const handleAssetChange = (event) => {
  //   setAsset(event.target.value);
  // };
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

  return (
    <>
      <Flex direction={"column"} gap={120} mb={150}>
        {/* Opening */}
        <Flex
          direction={"column"}
          maxW={"100%"}
          gap={10}
          p={10}
          align={"center"}
        >
          <Heading
            fontFamily={"Montserrat Variable"}
            size={"4xl"}
            textAlign={"center"}
            w={"80%"}
          >
            Supercharged Oracle For The Mina Protocol
          </Heading>
          <Text
            fontFamily={"Source Code Pro Variable"}
            fontSize={"2xl"}
            width={"100%"}
            textAlign={"center"}
          >
            <Box
              as={"span"}
              color={"#8c54ff"}
              fontSize={"3xl"}
              fontWeight={800}
            >
              Verifiable, Transparent.
            </Box>
            <br />
            That's how we like our asset feeds for the Mina Protocol.
          </Text>
          <Flex gap={5}>
            <Link href="https://docs.doot.foundation/" target="_blank">
              <Button
                alignItems={"center"}
                justifyItems={"center"}
                p={"5px 30px"}
                borderRadius={20}
                gap={2}
                transition={"0.2s"}
                _hover={{ gap: "5" }}
                _active={{}}
                background={
                  " linear-gradient(75deg, rgba(88,255,216,1) 16%, rgba(170,81,255,1) 100%);"
                }
                fontFamily={"Montserrat Variable"}
              >
                <Text fontWeight={"bold"}>TRY DOOT</Text>
                <FaArrowRightLong />
              </Button>
            </Link>
            <Link href="https://docs.doot.foundation/" target="_blank">
              <Button
                alignItems={"center"}
                justifyItems={"center"}
                p={"5px 30px"}
                borderRadius={20}
                gap={2}
                transition={"0.2s"}
                _hover={{ gap: "5" }}
                _active={{}}
                fontFamily={"Montserrat Variable"}
              >
                <Text fontWeight={"bold"}>Learn More</Text>
                <FaArrowRightLong />
              </Button>
            </Link>
          </Flex>
        </Flex>

        {/* Features */}
        <Flex direction={"column"} align={"center"}>
          <Heading size={"lg"} fontFamily={"Source Code Pro Variable"}>
            for@developers:~${" "}
            <Box
              animation={`${blinking} 1.2s step-start infinite`}
              display={"inline "}
              color={"#0ce1ae"}
            >
              _
            </Box>
          </Heading>
          <Text fontSize={"xl"}>
            Who prioritize transparency, accuracy and verifiability.
          </Text>

          <Flex
            direction={"row"}
            padding={"0px 140px"}
            gap={5}
            mt={10}
            // on
            // animation={`${slideIn} 1s ease-in-out forwards`}
          >
            <InformationCard>
              <GiAllSeeingEye size={100} />
              <Heading
                textAlign={"center"}
                fontFamily={"Manrope Variable"}
                fontWeight={900}
              >
                Asset Prices
              </Heading>
              <Text fontSize={20} textAlign={"center"}>
                Mina-compatible asset feeds readily available for developers,
                tracking several prominent assets. The accuracy of our final
                results extends up to ten decimal places, providing developers
                with highly precise data.
              </Text>
            </InformationCard>
            <Spacer />
            <InformationCard>
              <MdOutlineJoinInner size={100} />
              <Heading
                textAlign={"center"}
                fontFamily={"Manrope Variable"}
                fontWeight={900}
              >
                Aggregated
              </Heading>
              <Text fontSize={20} textAlign={"center"}>
                Pooling insights from diverse sources, our curated aggregation
                method ensures an unadulterated stream of information. This
                allows us to leave no room for manipulation or failure.
              </Text>
            </InformationCard>
            <Spacer />
            <InformationCard>
              <MdOutlineCleaningServices size={100} />
              <Heading
                textAlign={"center"}
                fontFamily={"Manrope Variable"}
                fontWeight={900}
              >
                Filtered
              </Heading>
              <Text fontSize={20} textAlign={"center"}>
                We meticulously eliminate outliers to extract the authentic
                value, ensuring a signal devoid of disruptive noise that might
                otherwise yield inaccurate outcomes.
              </Text>
            </InformationCard>
          </Flex>
          <Flex
            direction={"row"}
            mt={10}
            mb={10}
            p={"0px 100px"}
            justify={"center"}
            gap={10}
          >
            <InformationCard>
              <GoVerified size={100} strokeWidth={1} />
              <Heading
                textAlign={"center"}
                fontFamily={"Manrope Variable"}
                fontWeight={900}
              >
                Verify
              </Heading>
              <Text textAlign={"center"}>
                Every phase of our process is publically accessible, providing
                transparency and enabling independent verification.
                <br />
                Individuals interested in validating the computed can use our
                intuitive user interface. Additionally, they can also leverage
                the smart contracts deployed on the Mina's Berkeley Testnet for
                further verification.
              </Text>
            </InformationCard>
            <InformationCard>
              <LuPartyPopper size={100} />
              <Heading
                textAlign={"center"}
                fontFamily={"Manrope Variable"}
                fontWeight={900}
              >
                Much More!
              </Heading>
              <Text textAlign={"center"}>
                We are commited to help streamline the developer experience for
                Oracles on the Mina Protocol and let them focus on what matters
                the most. In line with this objective, over the coming months,
                we anticipate unveiling numerous exciting features and
                improvements that will enhance the overall developer experience.
              </Text>
            </InformationCard>
          </Flex>
        </Flex>

        {/* Testing  */}
        <Flex direction={"column"}>
          <Flex direction={"column"} alignItems={"left"}>
            <Flex ml={200} direction={"row"} align={"center"} gap={10}>
              <Box
                background={
                  "linear-gradient(90deg, #6c35de 0%,rgba(23,0,44,1) 100%)"
                }
                w={200}
                h={5}
              ></Box>
              <Heading
                letterSpacing={3}
                size={"3xl"}
                fontFamily={"Montserrat Variable"}
              >
                TEST DOOT
              </Heading>
            </Flex>{" "}
            <Heading
              letterSpacing={3}
              size={"3xl"}
              fontFamily={"Montserrat Variable"}
              ml={200}
            >
              ASSET FEEDS
            </Heading>
          </Flex>

          <Flex
            direction={"row"}
            align={"center"}
            justify={"center"}
            mt={50}
            gap={5}
          >
            <Flex
              background={"linear-gradient(120deg,#2c0055 0%, #5126a9 100%)"}
              direction={"column"}
              borderRadius={10}
              p={5}
              minH={400}
              w={"22%"}
              pos={"relative"}
            >
              <Text fontSize={25}>
                Choose the asset and run the asset feed.
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
            <Flex
              direction={"column"}
              h={400}
              w={"50%"}
              fontFamily={"Source Code Pro Variable"}
            >
              <Flex
                gap={2}
                background={
                  "linear-gradient(190deg, rgba(23,0,44,1) 0%, #5126a9 100%)"
                }
                p={3}
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
                  >
                    <Box
                      cursor={"pointer"}
                      onClick={() => {
                        setMode("res");
                      }}
                      fontWeight={mode == "res" ? 900 : 500}
                      color={"#0ce1ae"}
                    >
                      Response
                    </Box>
                    <Box
                      cursor={"pointer"}
                      onClick={() => {
                        setMode("req");
                      }}
                      fontWeight={mode == "req" ? 900 : 500}
                      color={"#0ce1ae"}
                    >
                      API Endpoint
                    </Box>
                  </Flex>
                  <Flex p={10} fontWeight={800}>
                    <Text
                      maxW={"100%"}
                      hidden={mode == "req"}
                      dangerouslySetInnerHTML={{
                        __html: result,
                      }}
                    ></Text>
                    <Text maxW={"100%"} hidden={mode == "res"}>
                      {`https://doot.foundation/api/get/getPrice?token=${asset}`}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
