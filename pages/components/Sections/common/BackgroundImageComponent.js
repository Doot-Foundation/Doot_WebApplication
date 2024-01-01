import { Flex, Box } from "@chakra-ui/react";

export default function BackgroundImageComponent({ children }) {
  return (
    <>
      <Flex position={"relative"} minH={"100vh"} direction={"column"}>
        <Box
          h={"100%"}
          w={"100%"}
          zIndex={"-1"}
          bgImage={"/static/images/stockBg.jpg"}
          bgSize={"cover"}
          bgPosition={"center"}
          bgRepeat={"no-repeat"}
          direction={"column"}
          position={"absolute"}
          top={0}
          left={0}
          background={
            "linear-gradient(90deg, rgba(19,19,19,1) 0%, rgba(19,19,19,0.5786647422640931) 50%, rgba(19,19,19,1) 100%);"
          }
        />
        {children}
      </Flex>
    </>
  );
}
