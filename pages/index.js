import HomeLayout from "./components/home/HomeLayout";
import HomeHero from "./components/home/HomeHero";
import Footer from "./components/common/Footer";

import { useMediaQuery } from "@chakra-ui/react";
import MobileViewUnavailable from "./components/common/MobileViewUnavailable";

export default function Home() {
  const [isLargerThanMd] = useMediaQuery("(min-width: 1280px)");
  if (!isLargerThanMd) return <MobileViewUnavailable />;

  return (
    <>
      <HomeLayout>
        <HomeHero />
        <Footer />
      </HomeLayout>
    </>
  );
}
