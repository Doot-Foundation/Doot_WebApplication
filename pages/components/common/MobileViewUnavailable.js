import React, { useState, useEffect } from "react";
import { Image, Heading, Flex, Text } from "@chakra-ui/react";

export default function MobileViewUnavailable() {
  const [isContentVisible, setIsContentVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsContentVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isContentVisible) {
    return null;
  }

  return (
    <>
      <Flex
        align="center"
        justify="center"
        direction="column"
        height="100vh"
        gap="5"
        p={10}
      >
        <Image src="/static/images/DootDot.png" />
        <Image src="/static/images/not_available.png" h="150px" w="180px" />
        <Heading fontFamily="Montserrat Variable" textAlign="center">
          Sorry, We don't support mobile view.
        </Heading>
      </Flex>
    </>
  );
}
