import { Box, Flex, Heading, Text } from "@chakra-ui/react";

import TokenDescriptionBox from "./TokenDescriptionBox";
import { TOKEN_TO_CACHE } from "../../../utils/constants/info";

export default function FeedsHero() {
  const tokens = Object.keys(TOKEN_TO_CACHE);

  return (
    <>
      <Box
        maxW="1200px"
        w="100%"
        m="0 auto"
        mb={{ base: 10, md: 100 }}
        borderRadius={{ base: 0, md: 24 }}
        border={{ base: "none", md: "1px solid #333333" }}
        background={{ base: "transparent", md: "rgba(26,26,26,0.8)" }}
        p={{ base: 6, md: 10, lg: 20 }}
        boxShadow={{ base: "none", md: "0 20px 60px rgba(107, 27, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}
      >
        <Flex direction={"column"} gap={16} position="relative" zIndex={1}>
          <Flex gap={6} direction={"column"}>
            <Heading
              size={"3xl"}
              fontFamily={"Montserrat Variable"}
              bgGradient="linear(to-r, #FFFFFF, #E0E0FF)"
              bgClip="text"
              fontWeight="700"
            >
              Data Feeds
            </Heading>
            <Text fontSize={"lg"} color="#CCCCCC" lineHeight="1.6">
              Explore our range of data feeds available on the Mina Protocol.
            </Text>
          </Flex>
          <Flex direction={"column"}>
            <Heading
              fontFamily={"Montserrat Variable"}
              size={{ base: 'md', md: 'lg' }}
              mb={8}
              color="#F0F0F0"
            >
              Tickers Available
            </Heading>
            <Flex direction={"column"} gap={4} justify={"left"}>
              {tokens.map((token, index) => {
                return <TokenDescriptionBox key={index} token={token} />;
              })}
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </>
  );
}
