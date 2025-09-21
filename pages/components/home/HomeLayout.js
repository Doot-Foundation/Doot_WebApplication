import { Flex, Box } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const drift = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

export default function HomeLayout({ children }) {
  return (
    <Flex direction="column" position="relative" overflow="hidden" minH="100vh">
      {/* animated star-like background */}
      <Box position="fixed" inset={0} zIndex={-10} overflow="hidden" pointerEvents="none">
        <Box
          position="absolute"
          top={0}
          left={0}
          w="200%"
          h="120%"
          bgImage='
            radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.25) 2px, transparent 3px),
            radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.18) 1px, transparent 2px),
            radial-gradient(2px 2px at 240px 120px, rgba(255,255,255,0.22) 2px, transparent 3px),
            radial-gradient(1px 1px at 340px 60px, rgba(255,255,255,0.18) 1px, transparent 2px)
          '
          bgRepeat="repeat"
          animation={`${drift} 60s linear infinite`}
          opacity={0.25}
        />
      </Box>
      <Box position="relative" zIndex={0}>{children}</Box>
    </Flex>
  );
}
