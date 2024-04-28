import VerifyLayout from "./components/verify/VerifyLayout";
// import VerifyHeader from "./components/verify/VerifyHeader";
import HomeHeader from "./components/home/HomeHeader";
import VerifyHero from "./components/verify/VerifyHero";

export default function Verify() {
  return (
    <>
      <VerifyLayout>
        <HomeHeader />
        <VerifyHero />
      </VerifyLayout>
    </>
  );
}
