import { Box, Flex, Heading, Text } from "@chakra-ui/react";

import TokenDescriptionBox from "./TokenDescriptionBox";
import { TOKEN_TO_CACHE } from "../../../utils/constants/info";

export default function FeedsHero() {
  const tokens = Object.keys(TOKEN_TO_CACHE);

  return (
    <>
      <Box
        w={1200}
        m="0 auto"
        mb={100}
        borderRadius={24}
        border="1px solid #333333"
        background="rgba(26,26,26,0.8)"
        p={20}
        boxShadow="0 20px 60px rgba(107, 27, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
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
              size="lg"
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
