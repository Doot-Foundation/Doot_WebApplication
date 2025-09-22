// pages/feeds/[coin].js
import { Box } from "@chakra-ui/react";
import { useRouter } from "next/router";

import FeedsLayout from "../components/feeds/FeedsLayout";
import FeedsHero from "../components/feeds/FeedsHero";

import IndividualAsset from "../components/feeds/IndividualAsset";
import TokenNotSupported from "../components/feeds/TokenNotSupported";

import { SUPPORTED_TOKENS } from "../../utils/constants/info";
import Footer from "../components/common/Footer";

export default function TokenPage() {
  const router = useRouter();
  const { token } = router.query;

  const isSupportedToken = SUPPORTED_TOKENS.includes(token);

  return (
    <Box as="main" w="100%">
      <FeedsLayout>
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
    </Box>
  );
}
