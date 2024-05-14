import VerifyLayout from "./components/verify/VerifyLayout";
import VerifyHero from "./components/verify/VerifyHero";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

export default function Verify() {
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
