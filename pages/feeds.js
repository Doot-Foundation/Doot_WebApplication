import FeedsLayout from "./components/feeds/FeedsLayout";
import FeedsHeader from "./components/feeds/FeedsHeader";
import FeedsHero from "./components/feeds/FeedsHero";

import { useRouter } from "next/router";
// import IndividualAsset from "./components/dashboard/feeds/[token]";

export default function Feeds() {
  const router = useRouter();
  const { token } = router.query;

  const isSupportedCoin = ["MINA", "ETH", "LINK", "SOL", "BTC"].includes(token);

  return (
    <>
      <FeedsLayout>
        <FeedsHeader />
        <FeedsHero />
      </FeedsLayout>
    </>
  );
}
