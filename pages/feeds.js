import FeedsLayout from "./components/feeds/FeedsLayout";
import FeedsHeader from "./components/feeds/FeedsHeader";
import FeedsHero from "./components/feeds/FeedsHero";

import { SignerContext, ChainContext } from "../lib/context/contexts";
import { useEffect, useContext } from "react";

export default function Feeds() {
  const { setSigner } = useContext(SignerContext);
  const { setChain } = useContext(ChainContext);

  async function init() {
    if (window.mina) {
      const account = await window.mina.requestAccounts();
      const network = await window.mina.requestNetwork();
      setSigner(account[0]);
      setChain({ chainId: network.chainId, chainName: network.name });
    }
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <>
      <FeedsLayout>
        <FeedsHeader />
        <FeedsHero />
      </FeedsLayout>
    </>
  );
}
