import FeedsLayout from "./components/feeds/FeedsLayout";
import FeedsHeader from "./components/feeds/FeedsHeader";
import FeedsHero from "./components/feeds/FeedsHero";

export default function Feeds() {
  return (
    <>
      <FeedsLayout>
        <FeedsHeader />
        <FeedsHero />
      </FeedsLayout>
    </>
  );
}
