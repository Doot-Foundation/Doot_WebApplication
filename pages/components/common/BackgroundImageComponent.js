import { Flex, Box } from "@chakra-ui/react";

export default function BackgroundImageComponent({ children, imageURL }) {
  return (
    <>
      <Flex position={"relative"} h={"fit-content"} direction={"column"}>
        <Box
          h={"100%"}
          w={"100%"}
          position={"absolute"}
          top={0}
          left={0}
          zIndex={-2}
          bgImage={imageURL}
          bgSize={"cover"}
          bgPosition={"center"}
          bgRepeat={"no-repeat"}
        />
        <Box
          h={"100%"}
          w={"100%"}
          zIndex={-1}
          direction={"column"}
          position={"absolute"}
          top={0}
          left={0}
          background={
            "linear-gradient(0deg, rgba(7,7,7,1) 0%, rgba(7,7,7,0.9) 30%, rgba(7,7,7,0.8) 50%, rgba(7,7,7,0.9) 80%, rgba(7,7,7,1) 100%);"
          }
        />{" "}
        {children}
      </Flex>
    </>
  );
}
