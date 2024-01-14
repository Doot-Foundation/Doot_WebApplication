import VerifyLayout from "./components/verify/VerifyLayout";
import VerifyHeader from "./components/verify/VerifyHeader";
import VerifyHero from "./components/verify/VerifyHero";

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
