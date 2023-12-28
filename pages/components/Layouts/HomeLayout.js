import Header from "../Sections/common/Header";
import HomeHero from "../Sections/home/HomeHero";
import HomeFooter from "../Sections/home/HomeFooter";
import { Flex } from "@chakra-ui/react";

export default function HomeLayout() {
  return (
    <>
      <Header />
      <HomeHero />
      <HomeFooter />
    </>
  );
}
