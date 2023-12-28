import { Flex, Box, Heading, Text } from "@chakra-ui/react";

export default function HomeHero() {
  return (
    <>
      <Flex position={"relative"} minH={"100vh"} direction={"column"}>
        <Box
          h={"100%"}
          w={"100%"}
          position={"absolute"}
          top={"0"}
          zIndex={"-1"}
          bgImage={"/static/images/stockBg.jpg"}
          bgSize={"cover"}
          bgPosition={"center"}
          bgRepeat={"no-repeat"}
          direction={"column"}
          style={{
            filter: "brightness(0.2) ",
          }}
        />
        <Flex direction={"column"} maxW={"80%"} gap={10} p={10} mt="5%">
          <Heading
            fontFamily={"Montserrat Variable"}
            size={"4xl"}
            width={"fit-content"}
          >
            Supercharged Oracle For The Mina Protocol
          </Heading>
          <Text
            fontFamily={"Source Code Pro Variable"}
            fontSize={"2xl"}
            width={"100%"}
          >
            <Box
              as={"span"}
              color={"#9359FF"}
              fontSize={"3xl"}
              fontWeight={800}
            >
              Verifiable, Transparent.
            </Box>
            <br />
            That's how we like our data feeds for the Mina Protocol.
          </Text>
        </Flex>
      </Flex>
    </>
  );
}
