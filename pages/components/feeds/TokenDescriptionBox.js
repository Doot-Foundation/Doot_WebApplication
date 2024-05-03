import { Flex, Text, Spacer, Image, Link } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState, useContext } from "react";

import { TOKEN_TO_SYMBOL } from "../../../utils/constants/info";

import { useSelector } from "react-redux";

export default function TokenDescriptionBox({ token }) {
  const src = `/static/tokens/${token}.png`;

  const [information, setInformation] = useState(null);
  const [normalizedPrice, setNormalizedPrice] = useState(null);

  const chainName = useSelector((state) => state.network.chainName);

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
      <Link href={linkSource}>
        <Flex
          borderRadius={10}
          bgColor={"white"}
          color={"black"}
          align="center"
          w={"100%"}
          p={5}
          fontWeight={500}
        >
          <Flex direction={"row"} align={"center"} gap={2} w={"80%"}>
            <Image src={src} h={5} w={5} />
            <Text>{TOKEN_TO_SYMBOL[token]} / USD</Text>
          </Flex>
          <Spacer />
          {normalizedPrice && <Text>${normalizedPrice}</Text>}
        </Flex>
      </Link>
    </>
  );
}
