import { GiAllSeeingEye } from "react-icons/gi";
import { CiBadgeDollar } from "react-icons/ci";

import { Flex, Box, Heading, Text, Image } from "@chakra-ui/react";
import InformationCard from "./InformationCard";
import ScaleFadeBox from "../common/ScaleFadeBox";

export default function Features() {
  return (
    <>
      <Flex direction={"column"} align={"center"} w="100%" position="relative">
        <Flex direction="column" gap={10} align="center">
          <Box
            border="1.5px solid cyan"
            borderRadius="16px"
            p="20px 28px"
            fontWeight={600}
            style={{
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            fontFamily={"Source Code Pro Variable"}
            background="linear-gradient(92.63deg, #F3F3F3 -14.41%, #15B7B3 97.58%, #14B8B3 97.59%)"
          >
            FOR THE COMMUNITY, BY THE COMMUNITY.
          </Box>
          <Heading
            fontFamily={"Poppins"}
            fontWeight={"500"}
            fontSize={"56px"}
            maxW="70%"
            align="center"
          >
            Unleash your project's potential
            <br /> with a focus on transparency, accuracy and verifiablity.
          </Heading>
        </Flex>
        {/* ============= */}
        <Box align="center" p={20} w="100%">
          <Flex align="center" w="100%" justify="center">
            <Box mr={-370} mt={-450}>
              <InformationCard>
                <Image src="/static/images/data_feeds.png" />
                <Heading
                  textAlign={"center"}
                  fontFamily={"Montserrat Variable"}
                  fontWeight={600}
                  fontSize={"38px"}
                >
                  Aggregated
                </Heading>
                <Text fontSize={20} textAlign={"center"}>
                  Our curated aggregation method ensures an unadulterated stream
                  of information, leaving no room for manipulation or failure by
                  pooling insights from multiple sources.
                </Text>
              </InformationCard>
            </Box>
            <Flex direction="column" align="center">
              <Box>
                <InformationCard>
                  <CiBadgeDollar size={120} color="#E8E8E8" />
                  <Heading
                    textAlign={"center"}
                    fontFamily={"Montserrat Variable"}
                    fontWeight={600}
                    fontSize={"38px"}
                  >
                    Data Feeds
                  </Heading>
                  <Text fontSize={20} textAlign={"center"}>
                    Access o1js compatible data feeds with ease directly in your
                    project. With the trust of 10+ data providers and 10+
                    prominent assets.
                  </Text>
                </InformationCard>
              </Box>
              <Box zIndex={10}>
                <Box
                  borderRadius="20%"
                  w="fit-content"
                  overflow="hidden"
                  border={"5px solid white"}
                >
                  <GiAllSeeingEye size={250} />
                </Box>
                <Box
                  h={350}
                  mt={-1}
                  w={"10px"}
                  background="linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 100%)"
                ></Box>
                <Box
                  w={1200}
                  h={"10px"}
                  borderRadius={"50%"}
                  background="linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)"
                ></Box>
              </Box>
            </Flex>
            <Box ml={-370} mt={-450}>
              <InformationCard>
                <Image
                  src="
                /static/images/filtered.png"
                />
                <Heading
                  textAlign={"center"}
                  fontFamily={"Montserrat Variable"}
                  fontWeight={600}
                  fontSize={"38px"}
                >
                  Filtered
                </Heading>
                <Text fontSize={20} textAlign={"center"}>
                  We meticulously eliminate outliers to extract the authentic
                  value, ensuring a signal devoid of disruptive noise that might
                  otherwise yield inaccurate outcomes.
                </Text>
              </InformationCard>
            </Box>
          </Flex>
          <Flex justify="center" align="center" gap={350} mt={-500}>
            <Box>
              <InformationCard>
                <Image src="/static/images/verification.png" size={100} />
                <Heading
                  textAlign={"center"}
                  fontFamily={"Montserrat Variable"}
                  fontWeight={600}
                  fontSize={"38px"}
                >
                  Verify
                </Heading>
                <Text fontSize={20} textAlign={"center"}>
                  Our process is transparent and publicly accessible, enabling
                  independent verification. Utilize our intuitive User Interface
                  and Smart Contracts for validation
                </Text>
              </InformationCard>
            </Box>
            <Box>
              <InformationCard>
                <Image
                  src={"/static/images/trustless.png"}
                  size={100}
                  strokeWidth={1}
                />
                <Heading
                  textAlign={"center"}
                  fontFamily={"Montserrat Variable"}
                  fontWeight={600}
                  fontSize={"38px"}
                >
                  Trustless
                </Heading>
                <Text textAlign={"center"} fontSize={20}>
                  With the help of Async Circuit made available by Mina
                  Protocol, we can prove the interactions with data providers
                  hence there is no need to trust us.
                </Text>
              </InformationCard>
            </Box>
          </Flex>
        </Box>
        {/* ============= */}
        <Flex
          direction="column"
          align="center"
          justify="center"
          mt={20}
          mb={20}
          w={1200}
          position="relative"
          gap={"40px"}
        >
          <Image
            position="absolute"
            src="/static/images/Background_Lines.svg"
            minW="100vw"
          />
          <ScaleFadeBox>
            <Flex
              gap={2}
              fontSize={"56px"}
              align="center"
              justify="center"
              mb={5}
            >
              <Heading
                fontSize="56px"
                fontWeight={700}
                textAlign="center"
                fontFamily="'Montserrat Variable'"
              >
                <Box
                  style={{
                    background:
                      "linear-gradient(92.58deg, #6B1BFF 3.61%, #D2B9FF 58.75%)",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                  display="inline-block"
                >
                  Stay tuned
                </Box>{" "}
                for much more exciting features and improvements!
              </Heading>
            </Flex>
          </ScaleFadeBox>
          <Text fontWeight={"400"} fontSize="34px" align="center">
            We’re dedicated to streamlining the developer experience for
            integrating Oracles on the Mina Protocol, allowing them{" "}
            <b>focus on what matters the most</b>. Look forward to exciting
            enhancements and features coming soon to
            <b> enhance your overall experience</b>.
          </Text>
        </Flex>
      </Flex>
    </>
  );
}
