import { Flex, Box, keyframes } from "@chakra-ui/react";

export default function InformationCard({ children, flip }) {
  const spin = keyframes`
  to { transform: rotate(360deg); }
 `;
  return (
    <>
      <Flex
        w="386px"
        h="450px"
        position="relative"
        justify="center"
        align="center"
        p="1.5px"
        borderRadius="16px"
        overflow="hidden"
      >
        <Box
          position="absolute"
          h={"100%"}
          w={"100%"}
          background="linear-gradient(180deg, #6B1BFF 0%, rgba(163,100,255,0) 100%);"
        />
        <Flex
          zIndex={1}
          p={"40px 30px"}
          borderRadius="15px"
          direction={"column"}
          align={"center"}
          gap={5}
          h={"100%"}
          w={"100%"}
          background="#171717"
        >
          {children}
        </Flex>
      </Flex>
    </>
  );
}
