import { Box } from "@chakra-ui/react";
import HomeLayout from "./components/home/HomeLayout";
import HomeHero from "./components/home/HomeHero";
import Footer from "./components/common/Footer";

export default function Home() {
  return (
    <Box as="main" w="100%">
      <HomeLayout>
        <HomeHero />
        <Footer />
      </HomeLayout>
    </Box>
  );
}
