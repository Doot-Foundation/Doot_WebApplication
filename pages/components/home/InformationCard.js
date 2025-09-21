import { Flex, Box, SlideFade } from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";

export default function InformationCard({ children }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.2,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <>
      <SlideFade in={isVisible}>
        <Flex
          ref={ref}
          w="386px"
          h="480px"
          position="relative"
          justify="center"
          align="center"
          p="3px"
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
            p={"48px 32px"}
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
      </SlideFade>
    </>
  );
}
