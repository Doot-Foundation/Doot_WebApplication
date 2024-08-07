import { Button, Flex, Image } from "@chakra-ui/react";

import { useDispatch, useSelector } from "react-redux";
import { setSigner, setChainName } from "../../../lib/redux/slice";

import WalletError from "./WalletError";

import { useEffect, useState } from "react";

export default function ConnectButton() {
  const dispatch = useDispatch();

  const signer = useSelector((state) => state.network.signer);
  const chainName = useSelector((state) => state.network.chainName);

  const [showWalletPopup, setShowWalletPopup] = useState(false);

  if (typeof window === "undefined") {
  } else {
    window.mina?.on("accountsChanged", (accounts) => {
      sessionStorage.clear();

      sessionStorage.setItem("signer", accounts[0]);

      dispatch(setSigner(accounts[0]));
    });

    window.mina?.on("chainChanged", (network) => {
      let chName = network.networkID;
      chName = chName.split(":");
      chName = chName[1];
      chName = chName.toUpperCase();

      dispatch(setChainName(chName));
    });
  }

  async function handleConnection() {
    if (typeof window.mina == "undefined") {
      setShowWalletPopup(true);
    } else {
      if (!signer) {
        const accounts = await window.mina.requestAccounts();
        const network = await window.mina.requestNetwork();

        let chName = network.networkID;
        chName = chName.split(":");
        chName = chName[1];
        chName = chName[0].toUpperCase() + chName.slice(1);

        sessionStorage.setItem("signer", accounts[0]);

        dispatch(setSigner(accounts[0]));
        dispatch(setChainName(chName));
      }
    }
  }

  useEffect(() => {
    const sign = sessionStorage.getItem("signer");

    if (sign != "undefined") handleConnection();
  }, []);

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
                fontWeight="200"
              >
                <Image src="/static/images/mina.png" h="16px" />
                {chainName}
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
                w="96%"
                h="90%"
                bg="#171717" // Ensure the button's background is transparent
                color="white"
                _hover={{}}
                _active={{}}
                onClick={() => handleConnection()}
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
