import SlotsHeader from "./components/slots/SlotsHeader";
import SlotsLayout from "./components/slots/SlotsLayout";
import SlotsHero from "./components/slots/SlotsHero";

export default function Slots() {
  return (
    <>
      <SlotsLayout>
        <SlotsHeader />
        <SlotsHero />
      </SlotsLayout>
    </>
  );
}
