import { Flex } from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react";
import { SlideFade, Box, keyframes } from "@chakra-ui/react";

export default function InformationCard({ children }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update our state when the component is in view
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
      <Box ref={ref} w="506px" h="602px">
        <SlideFade initialScale={0.7} in={isVisible}>
          <Flex
            direction={"column"}
            align={"center"}
            gap={5}
            p="80px 50px"
            bg={`linear-gradient(180deg, rgba(94, 94, 229, 0.5) 0%, rgba(94, 94, 229, 0.35) 0.01%, rgba(3, 3, 3, 0) 100%)`}
            borderRadius={"16px"}
            transition={"0.5s"}
            style={{
              borderImage:
                "linear-gradient(93.52deg, #00EAB1 -14.28%, rgba(23, 190, 194, 0.91) 10.57%, rgba(39, 158, 206, 0.65) 39.37%, rgba(61, 116, 221, 0.61) 54.25%, rgba(81, 77, 236, 0.43) 77.66%, #6B1BFF 100%) 1 100%",
            }}
          >
            {children}
          </Flex>
        </SlideFade>
      </Box>
    </>
  );
}
