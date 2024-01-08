// pages/feeds/[coin].js
import { useRouter } from "next/router";
import FeedsLayout from "../components/feeds/FeedsLayout";
import FeedsHeader from "../components/feeds/FeedsHeader";
import IndividualAsset from "../components/feeds/IndividualAsset";

export default function TokenPage() {
  const router = useRouter();
  const { token } = router.query;

  const isSupportedCoin = ["MINA", "ETH", "LINK", "SOL", "BTC"].includes(token);

  return (
    <FeedsLayout>
      <FeedsHeader />
      {isSupportedCoin ? (
        <IndividualAsset token={token} />
      ) : (
        <p>Coin not supported</p>
      )}
    </FeedsLayout>
  );
}
