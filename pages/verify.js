import VerifyLayout from "./components/verify/VerifyLayout";
import VerifyHero from "./components/verify/VerifyHero";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

import { useMediaQuery } from "@chakra-ui/react";
import MobileViewUnavailable from "./components/common/MobileViewUnavailable";

export default function Verify() {
  const [isLargerThanMd] = useMediaQuery("(min-width: 1280px)");
  if (!isLargerThanMd) return <MobileViewUnavailable />;

  return (
    <>
      <VerifyLayout>
        <Header />
        <VerifyHero />
        <Footer />
      </VerifyLayout>
    </>
  );
}
