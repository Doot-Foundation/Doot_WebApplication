import { Heading, Flex } from "@chakra-ui/react";

import { useSelector } from "react-redux";

export default function WalletNotConnected() {
  const signer = useSelector((state) => state.network.signer);
  console.log(signer);

  return (
    <Flex
      h={500}
      gap={5}
      align="center"
      justify="center"
      w="100vw"
      direction="column"
    >
      <Heading
        letterSpacing="1px"
        fontFamily="Montserrat Variable"
        fontSize="20px"
        fontWeight="300"
      >
        {signer == null ? (
          <>DISCONNECTED WALLET</>
        ) : (
          <>SIGN IN WITH YOUR WALLET</>
        )}
      </Heading>
      <Heading fontFamily="Poppins" fontWeight={500} fontSize="36px">
        {signer == null ? (
          <>Connect your wallet to continue.</>
        ) : (
          <>If interrupted - Reload the page and try again.</>
        )}
      </Heading>
    </Flex>
  );
}
