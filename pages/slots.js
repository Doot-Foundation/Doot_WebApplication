import SlotsLayout from "./components/slots/SlotsLayout";
import SlotsHero from "./components/slots/SlotsHero";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

import { useMediaQuery } from "@chakra-ui/react";
import MobileViewUnavailable from "./components/common/MobileViewUnavailable";

export default function Slots() {
  const [isLargerThanMd] = useMediaQuery("(min-width: 1280px)");
  if (!isLargerThanMd) return <MobileViewUnavailable />;

  return (
    <>
      <SlotsLayout>
        <Header />
        <SlotsHero />
        <Footer />
      </SlotsLayout>
    </>
  );
}
