import VerifyLayout from "./components/verify/VerifyLayout";
import Header from "./components/common/Header";
import VerifyHero from "./components/verify/VerifyHero";
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
