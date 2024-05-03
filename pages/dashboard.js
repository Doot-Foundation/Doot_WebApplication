import DashboardHero from "./components/dashboard/DashboardHero";
import DashboardLayout from "./components/dashboard/DashboardLayout";

export default function Dashboard() {
  return (
    <>
      <DashboardLayout>
        <DashboardHero />
      </DashboardLayout>
    </>
  );
}
