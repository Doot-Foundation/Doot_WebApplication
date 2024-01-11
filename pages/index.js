import HomeLayout from "./components/home/HomeLayout";
import HomeHeader from "./components/home/HomeHeader";
import HomeHero from "./components/home/HomeHero";
import HomeFooter from "./components/home/HomeFooter";

import BackgroundImageComponent from "./components/common/BackgroundImageComponent";

import { SignerContext, ChainContext } from "../lib/context/contexts";
import { useEffect } from "react";

export default function Home() {
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
      <HomeLayout>
        <BackgroundImageComponent imageURL="/static/images/portrait_1.jpg">
          <HomeHeader />
          <HomeHero />
        </BackgroundImageComponent>
        <HomeFooter />
      </HomeLayout>
    </>
  );
}
