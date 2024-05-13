import DashboardHero from "./components/dashboard/DashboardHero";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

import { useMediaQuery } from "@chakra-ui/react";
import MobileViewUnavailable from "./components/common/MobileViewUnavailable";

export default function Dashboard() {
  const [isLargerThanMd] = useMediaQuery("(min-width: 1280px)");
  if (!isLargerThanMd) return <MobileViewUnavailable />;

  return (
    <>
      <DashboardLayout>
        <Header />
        <DashboardHero />
        <Footer />
      </DashboardLayout>
    </>
  );
}
