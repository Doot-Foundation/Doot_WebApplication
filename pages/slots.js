import SlotsLayout from "./components/slots/SlotsLayout";
import SlotsHero from "./components/slots/SlotsHero";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

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
