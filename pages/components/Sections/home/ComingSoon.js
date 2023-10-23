import { Image, Flex, Box, Heading, Text, Spacer } from "@chakra-ui/react";

export default function ComingSoon() {
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
        />{" "}
        <Flex p={10}>
          <Image src="/static/images/Doot.png" h={20} w={20} />
          <Spacer />
          <Box />
        </Flex>
        <Flex direction={"column"} maxW={"80%"} gap={10} p={10} mt={40}>
          <Heading
            fontFamily={"Montserrat Variable"}
            size={"4xl"}
            width={"fit-content"}
          >
            Coming Soon
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
              Verifiable, Trustless, Transparent.
            </Box>
            <br />
            That's how we like our data feeds for the Mina Protocol.
          </Text>
        </Flex>
      </Flex>
    </>
  );
}
