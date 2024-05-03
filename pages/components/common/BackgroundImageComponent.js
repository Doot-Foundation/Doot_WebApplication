import { Flex, Box } from "@chakra-ui/react";

export default function BackgroundImageComponent({ children, imageURL }) {
  return (
    <>
      <Flex position={"relative"} h={"fit-content"} direction={"column"}>
        <Box
          h={500}
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
          h={500}
          zIndex={-1}
          direction={"column"}
          position={"absolute"}
          top={0}
          left={0}
          background="radial-gradient(circle, rgba(23,23,23,0.9) 0%, rgba(23,23,23,1) 100%)"
        />
        {children}
      </Flex>
    </>
  );
}
