import { GiAllSeeingEye } from "react-icons/gi";
import { CiBadgeDollar } from "react-icons/ci";

import { Flex, Box, Heading, Text, Image } from "@chakra-ui/react";
import InformationCard from "./InformationCard";

export default function Features() {
  return (
    <>
      <Flex direction={"column"} align={"center"} w="100%" position="relative" px={{ base: 4, md: 0 }}>
        <Flex direction="column" gap={10} align="center">
          <Box
            border="1.5px solid cyan"
            borderRadius="16px"
            p="20px 28px"
            fontWeight={600}
            textAlign="center"
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
            fontSize={{ base: "26px", md: "32px", lg: "45px" }}
            maxW="1200px"
            align="center"
            mt={6}
            mx={{ base: 4, md: 6, lg: 8 }}
          >
            Fulfill your zkApp's data feed requirements with a focus on
            transparent, accurate, precise and provable nature right out of the
            box.
          </Heading>
        </Flex>
        {/* ============= */}
        <Box align="center" p={{ base: 6, md: 12, lg: 20 }} w="100%">
          <Flex align="center" w="100%" justify="center" direction={{ base: 'column', lg: 'row' }}>
            <Box mr={{ base: 0, lg: -370 }} mt={{ base: 0, lg: -410 }} display={{ base: 'none', lg: 'block' }}>
              <InformationCard>
                <Image src="/static/images/data_feeds.png" alt="Data Feeds" />
                <Heading
                  textAlign={"center"}
                  fontFamily={"Montserrat Variable"}
                  fontWeight={700}
                  fontSize={{ base: "28px", md: "36px", lg: "42px" }}
                  lineHeight="1.2"
                >
                  Aggregated
                </Heading>
                <Text
                  fontSize={{ base: 14, md: 16, lg: 18 }}
                  textAlign={"center"}
                  lineHeight="1.6"
                  color="#CCCCCC"
                  maxW="320px"
                >
                  Our price calculation mechanism ensures unwavering data
                  integrity by sourcing prices from over 13 data providers,
                  filtering them, and finally aggregating the results.
                </Text>
              </InformationCard>
            </Box>
            <Flex direction="column" align="center" display={{ base: 'none', lg: 'flex' }}>
              <Box>
                <InformationCard>
                  <CiBadgeDollar size={120} color="#E8E8E8" />
                  <Heading
                    textAlign={"center"}
                    fontFamily={"Montserrat Variable"}
                    fontWeight={700}
                    fontSize={{ base: "28px", md: "36px", lg: "42px" }}
                    lineHeight="1.2"
                  >
                    Data Feeds
                  </Heading>
                  <Text
                    fontSize={{ base: 14, md: 16, lg: 18 }}
                    textAlign={"center"}
                    lineHeight="1.6"
                    color="#CCCCCC"
                    maxW="320px"
                  >
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
                  background="linear-gradient(90deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 70%)"
                ></Box>
              </Box>
            </Flex>
            <Box ml={{ base: 0, lg: -370 }} mt={{ base: 0, lg: -410 }} display={{ base: 'none', lg: 'block' }}>
              <InformationCard>
                <Image src="/static/images/magnifying.png" />
                <Heading
                  textAlign={"center"}
                  fontFamily={"Montserrat Variable"}
                  fontWeight={700}
                  fontSize={{ base: "28px", md: "36px", lg: "42px" }}
                  lineHeight="1.2"
                >
                  Filtered
                </Heading>
                <Text
                  fontSize={{ base: 14, md: 16, lg: 18 }}
                  textAlign={"center"}
                  lineHeight="1.6"
                  color="#CCCCCC"
                  maxW="320px"
                >
                  We systematically eliminate outliers from the dataset using
                  the MAD Score, ensuring the aggregated value is devoid of
                  disruptive noise, thereby preventing inaccurate results.
                </Text>
              </InformationCard>
            </Box>
          </Flex>
          <Flex justify="center" align="center" gap={320} mt={-530} display={{ base: 'none', lg: 'flex' }}>
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
                  fontWeight={700}
                  fontSize={{ base: "28px", md: "36px", lg: "42px" }}
                  lineHeight="1.2"
                >
                  Trustless
                </Heading>
                <Text
                  textAlign={"center"}
                  fontSize={{ base: 14, md: 16, lg: 18 }}
                  lineHeight="1.6"
                  color="#CCCCCC"
                  maxW="320px"
                >
                  Leveraging ZkProgram by O1JS, we can prove the interactions
                  with data providers, thereby eliminating the need for trust.
                  Everything is hence provable by nature on Doot.
                </Text>
              </InformationCard>
            </Box>
            <Box>
              <InformationCard>
                <Image src="/static/images/verification.png" alt="Verification" size={100} />
                <Heading
                  textAlign={"center"}
                  fontFamily={"Montserrat Variable"}
                  fontWeight={700}
                  fontSize={{ base: "28px", md: "36px", lg: "42px" }}
                  lineHeight="1.2"
                >
                  Verify
                </Heading>
                <Text
                  fontSize={{ base: 14, md: 16, lg: 18 }}
                  textAlign={"center"}
                  lineHeight="1.6"
                  color="#CCCCCC"
                  maxW="320px"
                >
                  Every step of our process is transparent and publicly
                  accessible, facilitating independent verification. Our User
                  Interface and Smart Contracts are two of the ways for
                  verification.
                </Text>
              </InformationCard>
            </Box>
          </Flex>
          {/* Stacked cards for smaller screens */}
          <Flex direction="column" gap={6} display={{ base: 'flex', lg: 'none' }} mt={6}>
            <Box>
              <InformationCard>
                <Image src="/static/images/data_feeds.png" alt="Data Feeds" />
                <Heading textAlign="center" fontFamily="Montserrat Variable" fontWeight={700} fontSize={{ base: "28px", md: "36px" }}>
                  Aggregated
                </Heading>
                <Text fontSize={{ base: 14, md: 16 }} textAlign="center" lineHeight="1.6" color="#CCCCCC" maxW="320px">
                  Our price calculation mechanism ensures unwavering data integrity by sourcing prices from over 13 data providers, filtering them, and finally aggregating the results.
                </Text>
              </InformationCard>
            </Box>
            <Box>
              <InformationCard>
                <Image src="/static/images/magnifying.png" />
                <Heading textAlign="center" fontFamily="Montserrat Variable" fontWeight={700} fontSize={{ base: "28px", md: "36px" }}>
                  Filtered
                </Heading>
                <Text fontSize={{ base: 14, md: 16 }} textAlign="center" lineHeight="1.6" color="#CCCCCC" maxW="320px">
                  We systematically eliminate outliers from the dataset using the MAD Score, ensuring the aggregated value is devoid of disruptive noise, thereby preventing inaccurate results.
                </Text>
              </InformationCard>
            </Box>
            <Box>
              <InformationCard>
                <CiBadgeDollar size={100} color="#E8E8E8" />
                <Heading textAlign="center" fontFamily="Montserrat Variable" fontWeight={700} fontSize={{ base: "28px", md: "36px" }}>
                  Data Feeds
                </Heading>
                <Text fontSize={{ base: 14, md: 16 }} textAlign="center" lineHeight="1.6" color="#CCCCCC" maxW="320px">
                  Easily access data feeds compatible with Mina Protocol directly within your zkApp, supporting over 10 popular assets today.
                </Text>
              </InformationCard>
            </Box>
            <Box>
              <InformationCard>
                <Image src={'/static/images/trustless.png'} />
                <Heading textAlign="center" fontFamily="Montserrat Variable" fontWeight={700} fontSize={{ base: "28px", md: "36px" }}>
                  Trustless
                </Heading>
                <Text fontSize={{ base: 14, md: 16 }} textAlign="center" lineHeight="1.6" color="#CCCCCC" maxW="320px">
                  Leveraging ZkProgram by O1JS, we can prove interactions with data providers, eliminating the need for trust.
                </Text>
              </InformationCard>
            </Box>
            <Box>
              <InformationCard>
                <Image src={'/static/images/verification.png'} />
                <Heading textAlign="center" fontFamily="Montserrat Variable" fontWeight={700} fontSize={{ base: "28px", md: "36px" }}>
                  Verify
                </Heading>
                <Text fontSize={{ base: 14, md: 16 }} textAlign="center" lineHeight="1.6" color="#CCCCCC" maxW="320px">
                  Every step is transparent and verifiable through our UI and smart contracts.
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
          maxW="1200px"
          w="100%"
          position="relative"
          gap={"40px"}
        >
          <Flex
            gap={10}
            mt={32}
            mb={20}
            direction="column"
            fontSize={{ base: "24px", md: "36px", lg: "56px" }}
            align="center"
            justify="center"
          >
            <Heading
              fontSize={{ base: "24px", md: "36px", lg: "56px" }}
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
            <Text fontWeight={"400"} fontSize={{ base: "16px", md: "20px", lg: "34px" }} align="center">
              We're dedicated to streamlining the developer experience for
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