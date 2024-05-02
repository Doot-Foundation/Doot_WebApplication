import DashboardHero from "./components/dashboard/DashboardHero";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

import { SignerContext, ChainContext } from "../lib/context/contexts";
import { useEffect, useContext } from "react";

export default function Dashboard() {
  const { setSigner } = useContext(SignerContext);
  const { setChain } = useContext(ChainContext);

  async function init() {
    if (window && window.mina) {
      try {
        const account = await window.mina.requestAccounts();
        const network = await window.mina.requestNetwork();
        setSigner(account[0]);
        setChain({ chainId: network.chainId, chainName: network.name });
      } catch (err) {
        console.log("USER DENIED THE REQUEST");
      }
    }
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <>
      <DashboardLayout>
        <Header />
        <DashboardHero />
        <Footer />
      </DashboardLayout>
    </>
  );
}
