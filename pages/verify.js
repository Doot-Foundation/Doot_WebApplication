import VerifyLayout from "./components/verify/VerifyLayout";
import VerifyHero from "./components/verify/VerifyHero";
import Footer from "./components/common/Footer";

export default function Verify() {
  return (
    <>
      <VerifyLayout>
        <VerifyHero />
        <Footer />
      </VerifyLayout>
    </>
  );
}
