import { Button, Flex, Image, Box, PseudoBox } from "@chakra-ui/react";
import { SlArrowDown } from "react-icons/sl";

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
      <Flex direction="row" position="relative">
        {signer != null ? (
          <>
            <Button
              width="130px"
              height="48px"
              position="absolute"
              left="-140px"
              cursor="default"
            >
              <Flex
                direction={"row"}
                justify={"center"}
                align={"center"}
                gap={2}
                fontWeight="300"
              >
                <Image src="/static/images/mina.png" h="16px" />
                {chain.chainName}
              </Flex>
            </Button>
            <Button
              width="130px"
              height="48px"
              background="linear-gradient(93.59deg, #00EAB1 -14.32%, rgba(23, 190, 194, 0.91) 12.24%, rgba(39, 158, 206, 0.65) 35.82%, rgba(61, 116, 221, 0.61) 58.92%, rgba(81, 77, 236, 0.43) 83.94%, #6B1BFF 107.82%)"
              _active={{}}
              _hover={{}}
              color="white"
              cursor="default"
            >
              {signer.slice(0, 4) + "..." + signer.slice(-4)}
            </Button>
          </>
        ) : (
          <>
            <Flex
              width="130px"
              height="48px"
              p={0}
              justify="center"
              align="center"
              borderRadius="8px"
              background="linear-gradient(93.59deg, #00EAB1 -14.32%, rgba(23, 190, 194, 0.91) 12.24%, rgba(39, 158, 206, 0.65) 35.82%, rgba(61, 116, 221, 0.61) 58.92%, rgba(81, 77, 236, 0.43) 83.94%, #6B1BFF 107.82%)"
            >
              <Button
                w="98%"
                h="95%"
                bg="#171717" // Ensure the button's background is transparent
                color="white"
                _hover={{}}
                _active={{}}
                onClick={handleConnection}
              >
                Connect
              </Button>
            </Flex>
          </>
        )}

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
