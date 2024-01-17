// pages/feeds/[coin].js
import { useRouter } from "next/router";

import FeedsLayout from "../components/feeds/FeedsLayout";
import FeedsHeader from "../components/feeds/FeedsHeader";
import FeedsHero from "../components/feeds/FeedsHero";

import IndividualAsset from "../components/feeds/IndividualAsset";
import TokenNotSupported from "../components/feeds/TokenNotSupported";

import { SUPPORTED_TOKENS } from "../../utils/constants/info";

export default function TokenPage() {
  const router = useRouter();
  const { token } = router.query;

  const isSupportedToken = SUPPORTED_TOKENS.includes(token);

  return (
    <FeedsLayout>
      <FeedsHeader />
      {isSupportedToken ? (
        <IndividualAsset token={token} />
      ) : (
        <>
          <TokenNotSupported token={token} />
          <FeedsHero />
        </>
      )}
    </FeedsLayout>
  );
}
