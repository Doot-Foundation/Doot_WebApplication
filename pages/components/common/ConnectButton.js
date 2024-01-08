import { Button, Flex, Image } from "@chakra-ui/react";
import { RiArrowDownSLine } from "react-icons/ri";

import WalletError from "./WalletError";

import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { updateSigner } from "../../../lib/redux/signerSlice";
import { updateChain } from "../../../lib/redux/chainSlice";

export default function ConnectButton() {
  const dispatch = useDispatch();
  const signer = useSelector((state) => state.signer.address);
  const chainInfo = useSelector((state) => state.chain);

  const [showWalletPopup, setShowWalletPopup] = useState(false);

  if (typeof window === "undefined") {
  } else {
    window.mina?.on("chainChanged", (network) => {
      dispatch(
        updateChain({ chainId: network.chainId, chainName: network.name })
      );
    });
  }

  const handleConnection = async () => {
    if (typeof window.mina == "undefined") {
      setShowWalletPopup(true);
    } else {
      const account = await window.mina.requestAccounts();
      const network = await window.mina.requestNetwork();
      dispatch(updateSigner(account[0]));
      dispatch(
        updateChain({ chainId: network.chainId, chainName: network.name })
      );
    }
  };

  const handleCloseWalletPopup = () => {
    setShowWalletPopup(false); // Close the WalletPopup
  };

  return (
    <>
      <Flex direction={"row"} gap={2}>
        {signer != "0x00" ? (
          <Button fontWeight={300}>
            <Flex direction={"row"} justify={"center"} align={"center"} gap={2}>
              <Image src="/static/images/mina.png" boxSize={4} />
              {chainInfo.chainName}
            </Flex>
            <RiArrowDownSLine />
          </Button>
        ) : null}
        <Button
          colorScheme={signer == 0x00 ? "purple" : "orange"}
          onClick={handleConnection}
        >
          {signer == "0x00" ? (
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
