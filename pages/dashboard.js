import { Box } from "@chakra-ui/react";
import DashboardHero from "./components/dashboard/DashboardHero";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

export default function Dashboard() {
  return (
    <Box as="main" w="100%">
      <DashboardLayout>
        {/* <Header /> */}
        <DashboardHero />
        <Footer />
      </DashboardLayout>
    </Box>
  );
}
