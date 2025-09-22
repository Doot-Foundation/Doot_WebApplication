import { Heading, Flex } from "@chakra-ui/react";

import { useSelector } from "react-redux";

export default function WalletNotConnected() {
  const signer = useSelector((state) => state.network.signer);
  console.log(signer);

  return (
    <Flex
      h={{ base: 380, md: 500 }}
      gap={5}
      align="center"
      justify="center"
      w="100%"
      direction="column"
      px={{ base: 4, md: 0 }}
      textAlign="center"
    >
      <Heading
        letterSpacing="1px"
        fontFamily="Montserrat Variable"
        fontSize={{ base: "16px", md: "20px" }}
        fontWeight="300"
      >
        {signer == null ? (
          <>DISCONNECTED WALLET</>
        ) : (
          <>SIGN IN WITH YOUR WALLET</>
        )}
      </Heading>
      <Heading fontFamily="Poppins" fontWeight={500} fontSize={{ base: "20px", md: "28px", lg: "36px" }}>
        {signer == null ? (
          <>Connect your wallet to continue.</>
        ) : (
          <>If interrupted - Reload the page and try again.</>
        )}
      </Heading>
    </Flex>
  );
}
