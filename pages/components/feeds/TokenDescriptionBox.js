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
  const [isLoaded, setIsLoaded] = useState(false);
  function normalizePrice(str) {
    let num = parseFloat(str);
    num = num / Math.pow(10, 10);
    const precision = num < 1 ? 10000 : 1000;
    num = Math.round(num * precision) / precision;
    return num;
  }

  async function getInformation() {
    try {
      const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;
      const headers = {
        Authorization: "Bearer " + key,
      };

      const priceResponse = await axios.get(
        `/api/get/interface/getPrice?token=${token}`,
        {
          headers: headers,
        }
      );

      const graphResponse = await axios.get(
        `/api/get/interface/getGraphData?token=${token}`,
        {
          headers: headers,
        }
      );

      setGraphData(graphResponse.data.data.graph_data);
      setGraphMin(graphResponse.data.data.min_price);
      setGraphMax(graphResponse.data.data.max_price);
      setPercentage(graphResponse.data.data.percentage_change);
      setDirection(graphResponse.data.data.percentage_change[0]);

      setNormalizedPrice(normalizePrice(priceResponse.data.data.price));
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  }

  useEffect(() => {
    async function execute() {
      // Small delay to prevent flash before Auro wallet check
      setTimeout(async () => {
        await getInformation();
        setIsLoaded(true);
      }, 1000);
    }

    execute();
  }, []);

  const linkSource = `/feeds/${TOKEN_TO_SYMBOL[token]}`;

  if (!isLoaded) {
    return (
      <Flex
        borderRadius={16}
        bgColor={"#1A1A1A"}
        color={"white"}
        align="center"
        w={"100%"}
        p={6}
        border="1px solid #333333"
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
        opacity={0.3}
        h="76px"
      />
    );
  }

  return (
    <>
      <Link href={linkSource} _hover={{ textDecoration: "none" }}>
        <Flex
          borderRadius={16}
          bgColor={"#1A1A1A"}
          color={"white"}
          w={"100%"}
          p={{ base: 4, md: 6 }}
          fontWeight={500}
          border="1px solid #333333"
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
          position="relative"
          overflow="hidden"
          flexWrap={{ base: "wrap", md: "nowrap" }}
          rowGap={{ base: 2, md: 0 }}
          direction={{ base: "column", md: "row" }}
          align={{ base: "flex-start", md: "center" }}
          css={{
            "@keyframes shimmerMove": {
              "0%": {
                transform: "translateX(-120%) rotate(45deg)",
                opacity: 0,
              },
              "10%": { opacity: 1 },
              "90%": { opacity: 1 },
              "100%": {
                transform: "translateX(200%) rotate(45deg)",
                opacity: 0,
              },
            },
          }}
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(45deg, transparent 30%, rgba(107,27,255,0.15) 45%, rgba(0,255,255,0.05) 50%, rgba(107,27,255,0.15) 55%, transparent 70%)",
            opacity: 0,
            transform: "translateX(-120%) rotate(45deg)",
            transition: "opacity 0.3s ease",
            willChange: "transform, opacity",
          }}
          _hover={{
            transform: "translateY(-4px)",
            boxShadow:
              "0 15px 50px rgba(107, 27, 255, 0.4), 0 0 30px rgba(107, 27, 255, 0.3), 0 0 60px rgba(0, 255, 255, 0.1)",
            borderColor: "#6B1BFF",
            transition: "all 0.3s ease",
            "&::before": {
              animation: "shimmerMove 2s ease-out",
            },
          }}
          transition="all 0.3s ease"
        >
          <Flex
            direction={"row"}
            align={"center"}
            gap={3}
            w={{ base: "100%", md: "45%" }}
            minW={0}
          >
            <Image
              src={src}
              h={{ base: 6, md: 7 }}
              w={{ base: 6, md: 7 }}
              flexShrink={0}
            />
            <Text
              fontSize={{ base: "14px", md: "20px", lg: "22px" }}
              fontFamily="Montserrat Variable"
              noOfLines={1}
              fontWeight={600}
            >
              {TOKEN_TO_SYMBOL[token]} / USD
            </Text>
          </Flex>
          <Flex
            align="center"
            justify={{ base: "space-between", md: "center" }}
            cursor="pointer"
            w={{ base: "100%", md: "auto" }}
            minW={0}
          >
            <Text
              color={direction == "+" ? "green.400" : "red.400"}
              fontSize={{ base: "13px", md: "16px" }}
              flexShrink={0}
              fontWeight={500}
            >
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
            <Flex
              w={{ base: "100%", md: "30%" }}
              justify={{ base: "flex-end", md: "flex-end" }}
              minW={0}
            >
              <Text
                fontFamily="Montserrat Variable"
                letterSpacing={{ base: "0.5px", md: "2px" }}
                fontSize={{
                  base:
                    normalizedPrice?.toString().length > 8 ? "12px" : "14px",
                  md: normalizedPrice?.toString().length > 10 ? "16px" : "18px",
                  lg: "20px",
                }}
                noOfLines={1}
                wordBreak="break-all"
                fontWeight={700}
                textAlign="right"
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
