import Marquee from "react-fast-marquee";
import { Image, Text, Flex } from "@chakra-ui/react";
import {
  ENDPOINT_KEY_TO_IMAGE_NAME,
  ENDPOINT_TO_DATA_PROVIDER,
} from "@/utils/constants/info";

export default function MarqueeDataProviders({ providers = [] }) {
  // Provide a default value for providers
  function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  return (
    <Marquee>
      {providers.map((provider, index) => (
        <>
          <Flex
            key={index}
            p={{ base: 3, md: 5 }}
            m={{ base: 2, md: 3 }}
            direction="column"
            justify="center"
            align="center"
            gap={3}
          >
            <Image
              alt={`Provider Image ${provider}`}
              key={index}
              borderRadius={10}
              src={`/static/data_providers/${ENDPOINT_KEY_TO_IMAGE_NAME(
                provider
              )}.png`}
              boxSize={{ base: "48px", md: "70px" }}
            />
            <Text fontFamily="Montserrat Variable" fontWeight={600}>
              {ENDPOINT_TO_DATA_PROVIDER[provider] ||
                capitalizeFirstLetter(provider)}
            </Text>
          </Flex>
        </>
      ))}
    </Marquee>
  );
}
