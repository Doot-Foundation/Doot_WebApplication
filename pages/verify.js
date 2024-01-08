import VerifyLayout from "./components/dashboard/verify/VerifyLayout";
import VerifyHeader from "./components/dashboard/verify/VerifyHeader";
import VerifyHero from "./components/dashboard/verify/VerifyHero";

export default function Verify() {
  return (
    <>
      <VerifyLayout>
        <VerifyHeader />
        <VerifyHero />
      </VerifyLayout>
    </>
  );
}
