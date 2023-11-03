import Head from "next/head";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/montserrat";

export default function App({ Component, pageProps }) {
  const theme = extendTheme({
    styles: {
      global: {
        body: {
          bg: "#030306",
          color: "white",
        },
      },
    },
  });

  return (
    <>
      <Head>
        <title>Doot</title>
      </Head>
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </>
  );
}
