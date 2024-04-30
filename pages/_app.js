import Head from "next/head";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/montserrat";
import "@fontsource-variable/manrope";
import "@fontsource/poppins/100.css";
import "@fontsource/poppins/200.css";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/poppins/900.css";

import { useState } from "react";
import { SignerContext, ChainContext } from "../lib/context/contexts";

export default function App({ Component, pageProps }) {
  const [signer, setSigner] = useState(null);
  const [chain, setChain] = useState({ chainId: null, chainName: null });

  const theme = extendTheme({
    styles: {
      global: {
        body: {
          bg: "#171717",
          color: "white",
          fontFamily: "'Poppins', sans-serif",
        },
      },
    },
  });

  return (
    <>
      <SignerContext.Provider value={{ signer, setSigner }}>
        <ChainContext.Provider value={{ chain, setChain }}>
          <Head>
            <title>Doot</title>
          </Head>
          <ChakraProvider theme={theme}>
            <Component {...pageProps} />
          </ChakraProvider>
        </ChainContext.Provider>
      </SignerContext.Provider>
    </>
  );
}
