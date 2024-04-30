import Marquee from "react-fast-marquee";
import { Image, Text, Flex } from "@chakra-ui/react";

export default function MarqueeDataProviders({ providers }) {
  function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  return (
    <Marquee>
      {providers.map((provider, index) => (
        <>
          <Flex
            key={index}
            p={5}
            m={3}
            direction="column"
            justify="center"
            align="center"
            gap={3}
          >
            <Image
              key={index}
              borderRadius={10}
              src={`/static/data_providers/${provider}.png`}
              boxSize={"70px"}
            />
            <Text fontFamily="Montserrat Variable" fontWeight={600}>
              {capitalizeFirstLetter(provider)}
            </Text>
          </Flex>
        </>
      ))}
    </Marquee>
  );
}
