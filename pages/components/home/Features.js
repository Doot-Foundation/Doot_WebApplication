import { GiAllSeeingEye } from "react-icons/gi";
import { CiBadgeDollar } from "react-icons/ci";

import { Flex, Box, Heading, Text, Image } from "@chakra-ui/react";
import InformationCard from "./InformationCard";

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
            fontSize={"45px"}
            maxW="1200"
            align="center"
          >
            Fulfill your zkApp's data feed requirements with a focus on
            transparent, accurate, precise and provable nature right out of the
            box.
          </Heading>
        </Flex>
        {/* ============= */}
        <Box align="center" p={20} w="100%">
          <Flex align="center" w="100%" justify="center">
            <Box mr={-370} mt={-410}>
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
                  Our price calculation mechanism ensures unwavering data
                  integrity by sourcing prices from over 13 data providers,
                  filtering them, and finally aggregating the results.
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
                    Easily access data feeds compatible with Mina Protocol
                    directly within your zkApp, supporting over 10 popular
                    assets today.
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
                  h={380}
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
            <Box ml={-370} mt={-410}>
              <InformationCard>
                <Image
                  src="
                /static/images/magnifying.png"
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
                  We systematically eliminate outliers from the dataset using
                  the MAD Score, ensuring the aggregated value is devoid of
                  disruptive noise, thereby preventing inaccurate results.
                </Text>
              </InformationCard>
            </Box>
          </Flex>
          <Flex justify="center" align="center" gap={320} mt={-530}>
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
                  Leveraging Mina Protocol's ZkProgram, we can prove the
                  interactions with data providers, thereby eliminating the need
                  for trust. Everything is hence provable by nature on Doot.
                </Text>
              </InformationCard>
            </Box>
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
                  Every step of our process is transparent and publicly
                  accessible, facilitating independent verification. Our User
                  Interface and Smart Contracts are two of the ways for
                  verification.
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
          w={1200}
          position="relative"
          gap={"40px"}
        >
          <Image
            position="absolute"
            src="/static/images/Background_Lines.svg"
            minW="100vw"
            zIndex={-10}
          />
          <Flex
            gap={10}
            mt={32}
            mb={20}
            direction="column"
            fontSize={"56px"}
            align="center"
            justify="center"
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
                mr={4}
              >
                Stay tuned
              </Box>
              for much more exciting features and improvements!
            </Heading>
            <Text fontWeight={"400"} fontSize="34px" align="center">
              We’re dedicated to streamlining the developer experience for
              integrating Oracles on the Mina Protocol, allowing them to focus
              on their zkApps and let us take care of their data feed needs.
              Look forward to much exciting enhancements and features coming
              soon to the protocol.
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
