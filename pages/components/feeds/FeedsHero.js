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
        borderRadius={20}
        border={"1px solid #8c54ff"}
        background=" linear-gradient(200deg, rgba(140,84,255,0) 0%, rgba(140,84,255,0.2) 100%)"
      >
        <Flex direction={"column"} m={16} gap={10}>
          <Flex gap={5} direction={"column"}>
            <Heading size={"3xl"} fontFamily={"Montserrat Variable"}>
              Data Feeds
            </Heading>
            <Text fontSize={"lg"}>
              Explore our range of data feeds available on the Mina Protocol.
            </Text>
          </Flex>
          <Flex direction={"column"}>
            <Heading fontFamily={"Montserrat Variable"}>
              Tickers Available
            </Heading>
            <Flex direction={"column"} gap={5} mt={10} justify={"left"}>
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
