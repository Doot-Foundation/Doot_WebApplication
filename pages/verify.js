import { Box } from "@chakra-ui/react";
import VerifyLayout from "./components/verify/VerifyLayout";
import VerifyHero from "./components/verify/VerifyHero";
import Footer from "./components/common/Footer";

export default function Verify() {
  return (
    <Box as="main" w="100%">
      <VerifyLayout>
        <VerifyHero />
        <Footer />
      </VerifyLayout>
    </Box>
  );
}
