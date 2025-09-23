import React from "react";
import { Flex, Heading, Image } from "@chakra-ui/react";

export default function MobileViewUnavailable() {
  // No longer used; mobile view is supported.
  return (
    <Flex align="center" justify="center" direction="column" minH="60vh" p={6}>
      <Image src="/static/images/DootDot.png" alt="Doot" boxSize={{ base: 12, md: 16 }} />
      <Heading fontFamily="Montserrat Variable" fontSize={{ base: "lg", md: "2xl" }} mt={4}>
        Mobile view is now supported.
      </Heading>
    </Flex>
  );
}
