import Head from "next/head";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/montserrat";
import "@fontsource-variable/manrope";

import ReduxProvider from "../lib/redux/ReduxProvider";

export default function App({ Component, pageProps }) {
  const theme = extendTheme({
    styles: {
      global: {
        body: {
          bg: "#050505",
          color: "white",
          fontFamily: "'Manrope Variable', sans-serif",
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
        <ReduxProvider>
          <Component {...pageProps} />
        </ReduxProvider>
      </ChakraProvider>
    </>
  );
}
