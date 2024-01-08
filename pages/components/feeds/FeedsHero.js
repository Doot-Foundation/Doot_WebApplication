import { Box, Flex, Heading, Text } from "@chakra-ui/react";

import TokenDescriptionBox from "./TokenDescriptionBox";
import { SUPPORTED_TOKENS } from "../../../utils/constants/info";

export default function FeedsHero() {
  return (
    <>
      <Box
        m={10}
        mt={0}
        borderRadius={20}
        border={"1px solid #8c54ff"}
        minH={"100vh"}
        background=" linear-gradient(200deg, rgba(140,84,255,0) 0%, rgba(140,84,255,0.2) 100%)"
      >
        <Flex direction={"column"} m={16} gap={10}>
          <Flex gap={5} direction={"column"}>
            <Heading size={"3xl"} fontFamily={"Montserrat Variable"}>
              Doot Asset Feeds
            </Heading>
            <Text fontSize={"lg"}>
              Explore our asset feeds accessible for the Mina Protocol
            </Text>
          </Flex>
          <Flex>
            <Heading fontFamily={"Montserrat Variable"}>Popular Assets</Heading>
            <Flex direction={"column"} gap={5} mt={10}>
              {SUPPORTED_TOKENS.map((token, index) => {
                return <TokenDescriptionBox key={index} token={token} />;
              })}
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </>
  );
}
