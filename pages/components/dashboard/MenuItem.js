import { Flex } from "@chakra-ui/react";

export default function MenuItem({ children }) {
  return (
    <>
      <Flex
        fontWeight={600}
        bgColor={"transparent"}
        color={"white"}
        _hover={{ cursor: "pointer" }}
        fontFamily={"Manrope Variable"}
        _active={{}}
        align="center"
        gap={2}
      >
        {children}
      </Flex>
    </>
  );
}
