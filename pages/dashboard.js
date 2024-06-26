import DashboardHero from "./components/dashboard/DashboardHero";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

export default function Dashboard() {
  return (
    <>
      <DashboardLayout>
        {/* <Header /> */}
        <DashboardHero />
        <Footer />
      </DashboardLayout>
    </>
  );
}
