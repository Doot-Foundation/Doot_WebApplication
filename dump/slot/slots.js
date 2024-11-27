import SlotsLayout from "../../pages/components/slots/SlotsLayout";
import SlotsHero from "../../pages/components/slots/SlotsHero";
import Header from "../../pages/components/common/Header";
import Footer from "../../pages/components/common/Footer";

export default function Slots() {
  return (
    <>
      <SlotsLayout>
        {/* <Header /> */}
        <SlotsHero />
        <Footer />
      </SlotsLayout>
    </>
  );
}
