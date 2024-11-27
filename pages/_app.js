import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/montserrat";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/poppins/900.css";

import Header from "./components/common/Header";
import MobileViewUnavailable from "./components/common/MobileViewUnavailable";

import { useMediaQuery } from "@chakra-ui/react";

import { Provider } from "react-redux";
import { store } from "../lib/redux/store";

export default function App({ Component, pageProps }) {
  const [isLargerThanMd] = useMediaQuery("(min-width: 1280px)");

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
          {isLargerThanMd ? (
            <>
              <Header />
              <Component {...pageProps} />
            </>
          ) : (
            <MobileViewUnavailable />
          )}
          {/* <Component {...pageProps} /> */}
        </ChakraProvider>
        <Analytics />
      </Provider>
    </>
  );
}
