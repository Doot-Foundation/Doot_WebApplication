// pages/feeds/[coin].js
import { useRouter } from "next/router";

import FeedsLayout from "../components/feeds/FeedsLayout";
import FeedsHero from "../components/feeds/FeedsHero";

import IndividualAsset from "../components/feeds/IndividualAsset";
import TokenNotSupported from "../components/feeds/TokenNotSupported";

import { SUPPORTED_TOKENS } from "../../utils/constants/info";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

export default function TokenPage() {
  const router = useRouter();
  const { token } = router.query;

  const isSupportedToken = SUPPORTED_TOKENS.includes(token);

  return (
    <FeedsLayout>
      <Header />
      {isSupportedToken ? (
        <IndividualAsset token={token} />
      ) : (
        <>
          <TokenNotSupported token={token} />
          <FeedsHero />
        </>
      )}
      <Footer />
    </FeedsLayout>
  );
}
