import {
  Spacer,
  Flex,
  Box,
  Heading,
  Text,
  Button,
  FormControl,
  Link,
  Image,
} from "@chakra-ui/react";

import { keyframes } from "@emotion/react";

import axios from "axios";

import { useState } from "react";

import { GiAllSeeingEye } from "react-icons/gi";
import { MdOutlineJoinInner } from "react-icons/md";
import { MdOutlineCleaningServices } from "react-icons/md";
import { GoVerified } from "react-icons/go";
import { LuPartyPopper } from "react-icons/lu";

import HeroAnimatedText from "./HeroAnimatedText";
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

  const spin = keyframes`
  to { transform: rotate(360deg); }
 `;

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
          <Flex
            position="relative"
            direction="column"
            align="center"
            justify="center"
            fontSize="70px"
            fontWeight="600"
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
            <Box>Oracle</Box>
            <Box>For Mina Protocol</Box>
          </Flex>
          <Flex gap={28} mt={2}>
            <Link href="#" target="_blank">
              <Button
                position={"relative"}
                alignItems={"center"}
                justifyItems={"center"}
                p={"33px 54px"}
                gap={2}
                transition={"0.2s"}
                _active={{}}
                _hover={{}}
                background=" #6B1BFF"
                boxShadow=" 0px 0px 200px #6B1BFF, inset 0px -3px 0px rgba(0, 0, 0, 0.2), inset 0px 1px 0px rgba(255, 255, 255, 0.4)"
                borderRadius="100px"
                fontFamily={"Manrope Variable"}
                fontSize={"20px"}
                overflow="hidden"
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
                <Text color="white" fontWeight={"900"}>
                  Try Doot
                </Text>
              </Button>
            </Link>

            <Link
              href="https://docs.doot.foundation/"
              target="_blank"
              _hover={{}}
            >
              <Flex
                position="relative"
                justify="center"
                align="center"
                borderRadius="100px"
                p="4px 4px"
                overflow="hidden"
              >
                <Box
                  position="absolute"
                  top={0}
                  h={"100%"}
                  w={"100%"}
                  background="linear-gradient(90deg, #5E5EE5 -9.95%, rgba(129, 129, 222, 0.8) 12.47%, rgba(94, 94, 229, 0.62) 30.87%, rgba(28, 25, 26, 0.89) 53.87%, rgba(68, 220, 183, 0.65) 70.34%, #00EAB1 100.44%)"
                  animation={`${spin} 5s infinite ease`}
                />
                <Button
                  p={"29px 54px"}
                  alignItems={"center"}
                  justifyItems={"center"}
                  gap={2}
                  transition={"0.2s"}
                  _active={{}}
                  _hover={{}}
                  background="#202020"
                  borderRadius="100px"
                  fontFamily={"Manrope Variable"}
                  fontSize={"20px"}
                  overflow="hidden"
                >
                  <Image src="/static/images/stars.png" alt="Stars" />
                  <Text color="white" fontWeight={"900"}>
                    Learn More
                  </Text>
                </Button>
              </Flex>
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
