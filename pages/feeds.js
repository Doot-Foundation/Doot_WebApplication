import FeedsLayout from "./components/feeds/FeedsLayout";
import FeedsHero from "./components/feeds/FeedsHero";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

import { useMediaQuery } from "@chakra-ui/react";
import MobileViewUnavailable from "./components/common/MobileViewUnavailable";

export default function Feeds() {
  const [isLargerThanMd] = useMediaQuery("(min-width: 1280px)");
  if (!isLargerThanMd) return <MobileViewUnavailable />;

  return (
    <>
      <FeedsLayout>
        <Header />
        <FeedsHero />
        <Footer />
      </FeedsLayout>
    </>
  );
}
