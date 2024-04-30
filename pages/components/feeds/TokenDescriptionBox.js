import { Flex, Text, Spacer, Image, Link } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState, useContext } from "react";

import { TOKEN_TO_SYMBOL } from "../../../utils/constants/info";

import { ChainContext } from "../../../lib/context/contexts";

export default function TokenDescriptionBox({ token }) {
  const { chain } = useContext(ChainContext);
  const src = `/static/tokens/${token}.png`;

  const [information, setInformation] = useState(null);
  const [normalizedPrice, setNormalizedPrice] = useState(null);

  function normalizePrice(str) {
    let num = parseInt(str);
    num = num / Math.pow(10, 10);
    num = Math.round(num * 100) / 100;
    return num;
  }

  if (information && normalizedPrice == null) {
    const res = normalizePrice(information.price);
    setNormalizedPrice(res);
  }

  async function getInformation() {
    try {
      const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;
      const headers = {
        Authorization: "Bearer " + key,
      };
      const response = await axios.get(
        `/api/get/getPriceInterface?token=${token}`,
        {
          headers: headers,
        }
      );
      setInformation(response.data.information);
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  }

  useEffect(() => {
    getInformation();
  }, []);

  const linkSource = `/feeds/${TOKEN_TO_SYMBOL[token]}`;

  return (
    <>
      <Link href={linkSource} w={"80%"}>
        <Flex
          bgColor={"white"}
          color={"black"}
          borderRadius={10}
          p={2}
          w={"100%"}
        >
          <Flex direction={"row"} p={3} align={"center"} gap={2} w={"80%"}>
            <Image src={src} h={5} w={5} />
            <Text fontWeight={600}>{TOKEN_TO_SYMBOL[token]} / USD</Text>
          </Flex>
          <Spacer />
          <Flex direction={"column"} mr={5} justify={"center"} minW={"10%"}>
            {normalizedPrice && (
              <Text fontFamily="Source Code Pro Variable" fontWeight={600}>
                ${normalizedPrice}
              </Text>
            )}
            <Text>{chain.chainName}</Text>
          </Flex>
        </Flex>
      </Link>
    </>
  );
}
