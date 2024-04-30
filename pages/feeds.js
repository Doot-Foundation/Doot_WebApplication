import FeedsLayout from "./components/feeds/FeedsLayout";
import Header from "./components/common/Header";
import FeedsHero from "./components/feeds/FeedsHero";

export default function Feeds() {
  return (
    <>
      <FeedsLayout>
        <Header />
        <FeedsHero />
      </FeedsLayout>
    </>
  );
}
