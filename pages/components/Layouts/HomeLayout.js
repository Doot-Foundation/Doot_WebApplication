import Header from "../Sections/common/Header";
import HomeHero from "../Sections/home/HomeHero";
import HomeFooter from "../Sections/home/HomeFooter";
import { Flex, Box } from "@chakra-ui/react";

import BackgroundImageComponent from "../Sections/common/BackgroundImageComponent";

export default function HomeLayout() {
  return (
    <>
      <Flex minH={"100vh"} direction={"column"}>
        <BackgroundImageComponent imageURL="/static/images/portrait_1.jpg">
          <Header />
          <HomeHero />
        </BackgroundImageComponent>
        <HomeFooter />
      </Flex>
    </>
  );
}
