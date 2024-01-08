import { Flex } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";

export default function TokenDescriptionBox({ token }) {
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

  return <></>;
}
