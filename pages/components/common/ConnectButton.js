import { Button, Flex, Image } from "@chakra-ui/react";
import { RiArrowDownSLine } from "react-icons/ri";

import WalletError from "./WalletError";

import { useState } from "react";

import { useContext } from "react";
import { SignerContext, ChainContext } from "../../../lib/context/contexts";

export default function ConnectButton() {
  const { signer, setSigner } = useContext(SignerContext);
  const { chain, setChain } = useContext(ChainContext);

  const [showWalletPopup, setShowWalletPopup] = useState(false);

  if (typeof window === "undefined") {
  } else {
    window.mina?.on("chainChanged", (network) => {
      setChain({ chainId: network.chainId, chainName: network.name });
    });
  }

  const handleConnection = async () => {
    if (typeof window.mina == "undefined") {
      setShowWalletPopup(true);
    } else {
      const account = await window.mina.requestAccounts();
      const network = await window.mina.requestNetwork();
      setSigner(account[0]);
      setChain({ chainId: network.chainId, chainName: network.name });
    }
  };

  const handleCloseWalletPopup = () => {
    setShowWalletPopup(false); // Close the WalletPopup
  };

  return (
    <>
      <Flex direction={"row"} gap={2}>
        {signer != null ? (
          <Button fontWeight={300}>
            <Flex direction={"row"} justify={"center"} align={"center"} gap={2}>
              <Image src="/static/images/mina.png" boxSize={4} />
              {chain.chainName}
            </Flex>
            <RiArrowDownSLine />
          </Button>
        ) : null}
        <Button
          colorScheme={!signer ? "purple" : null}
          bgColor={signer ? "#00eab1" : null}
          onClick={handleConnection}
          _hover={
            signer
              ? {
                  backgroundColor: "#00bc8f",
                }
              : null
          }
        >
          {signer == null ? (
            <>Connect</>
          ) : (
            signer.slice(0, 4) + "..." + signer.slice(-4)
          )}
        </Button>
        {showWalletPopup && (
          <WalletError
            isOpen={showWalletPopup}
            onClose={handleCloseWalletPopup}
          />
        )}
      </Flex>
    </>
  );
}
