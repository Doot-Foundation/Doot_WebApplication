import { Flex, Text, Spacer, Image, Link } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";

import { TOKEN_TO_SYMBOL } from "../../../utils/constants/info";
import MiniChartDescriptionBox from "./MiniChartDescriptionBox";

export default function TokenDescriptionBox({ token }) {
  const src = `/static/slot_token/${token}.png`;

  const [normalizedPrice, setNormalizedPrice] = useState(null);
  const [direction, setDirection] = useState("+");
  const [graphData, setGraphData] = useState(null);
  const [graphMin, setGraphMin] = useState(null);
  const [graphMax, setGraphMax] = useState(null);
  const [percentage, setPercentage] = useState("0.00%");

  function normalizePrice(str) {
    let num = parseInt(str);
    num = num / Math.pow(10, 10);
    num = Math.round(num * 100) / 100;
    return num;
  }

  async function getInformation() {
    try {
      const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;
      const headers = {
        Authorization: "Bearer " + key,
      };
      const priceResponse = await axios.get(
        `/api/get/getPriceInterface?token=${token}`,
        {
          headers: headers,
        }
      );
      const graphResponse = await axios.get(
        `/api/get/getGraphDataInterface?token=${token}`,
        {
          headers: headers,
        }
      );

      setGraphData(graphResponse.data.information.graph_data);
      setGraphMin(graphResponse.data.information.min_price);
      setGraphMax(graphResponse.data.information.max_price);
      setPercentage(graphResponse.data.information.percentage_change);
      setDirection(graphResponse.data.information.percentage_change[0]);

      setNormalizedPrice(normalizePrice(priceResponse.data.information.price));
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
          <Flex direction={"row"} align={"center"} gap={4} w="40%">
            <Image src={src} h={7} w={7} />
            <Text fontSize="22px" fontFamily="Montserrat Variable">
              {TOKEN_TO_SYMBOL[token]} / USD
            </Text>
          </Flex>
          <Flex align="center" justify="center" cursor="pointer">
            <Text color={direction == "+" ? "green.400" : "red.400"}>
              {percentage}
            </Text>
            <MiniChartDescriptionBox
              direction={direction}
              data={graphData}
              graphMax={graphMax}
              graphMin={graphMin}
            />
          </Flex>
          <Spacer />
          {normalizedPrice && (
            <Flex w="15%">
              <Text
                fontFamily="Montserrat Variable"
                letterSpacing="2px"
                fontSize="22px"
              >
                ${normalizedPrice}
              </Text>
            </Flex>
          )}
        </Flex>
      </Link>
    </>
  );
}
