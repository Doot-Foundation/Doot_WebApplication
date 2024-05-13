import Head from "next/head";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/montserrat";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/poppins/900.css";

import { Provider } from "react-redux";
import { store } from "../lib/redux/store";

export default function App({ Component, pageProps }) {
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
      <Provider store={store}>
        <Head>
          <title>Doot</title>
        </Head>
        <ChakraProvider theme={theme}>
          <Component {...pageProps} />
        </ChakraProvider>
      </Provider>
    </>
  );
}
