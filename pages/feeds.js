import FeedsLayout from "./components/feeds/FeedsLayout";
import FeedsHero from "./components/feeds/FeedsHero";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

export default function Feeds() {
  return (
    <>
      <FeedsLayout>
        <Header />
        <FeedsHero />
        <Footer />
      </FeedsLayout>
    </>
  );
}
