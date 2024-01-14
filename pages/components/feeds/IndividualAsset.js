import { Flex, Heading, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";

export default function IndividualAsset({ token }) {
  const axios = require("axios");
  const [information, setInformation] = useState(null);

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

  if (information) console.log(information);

  return (
    <>
      <Flex direction={"column"} pl={20} minH={"100%"} minW={"100%"} gap={7}>
        <Heading fontSize={"5xl"} fontFamily={"Source Code Pro Variable"}>
          {token}/USD
        </Heading>
        <Flex direction={"row"}>
          <Flex
            direction={"column"}
            bgColor={"white"}
            borderRadius={10}
            boxShadow={"0px 0px 10px 0px white"}
            minH={400}
            w={"30%"}
          ></Flex>
          <Flex direction={"column"}></Flex>
        </Flex>
      </Flex>
    </>
  );
}
