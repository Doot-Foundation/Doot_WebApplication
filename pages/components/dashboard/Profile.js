import {
  Flex,
  Heading,
  Text,
  Spacer,
  useToast,
  Button,
} from "@chakra-ui/react";

import { TfiKey, TfiUser } from "react-icons/tfi";
import GradientLineChart from "./GradientLineChart";
import { SignerContext } from "../../../lib/context/contexts";
import { useState, useContext } from "react";

export default function Profile({ info }) {
  const publicKey = info ? info.address : null;
  const timestamp = info ? info.created_at : null;
  const plan = info ? info.plan : null;
  const calls = info ? JSON.parse(info.calls) : null;

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [api, setAPI] = useState(info ? info.generated_key : null);
  const toast = useToast();
  const { signer } = useContext(SignerContext);
  const axios = require("axios");

  function formatDate(timestamp) {
    if (timestamp) {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed in JS
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } else return "YYYY-MM-DD";
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(api);
      toast({
        title: "Copied Successfully",
        duration: "2000",
        status: "success",
        position: "top",
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const handleUpdateAPI = async () => {
    setIsSubmitted(true);
    const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

    const obj = {
      address: signer ? signer : null,
      api: api,
    };
    const userObj = JSON.stringify(obj);

    const headers = {
      Authorization: "Bearer " + key,
      User: userObj,
    };

    await axios
      .get(`/api/update/updateAPIKey`, {
        headers: headers,
      })
      .then((res) => {
        toast({
          title: "Updated API Key Successfully!",
          duration: "7000",
          status: "success",
          position: "top",
        });
        setAPI(res.data.key);
      })
      .catch((err) => {
        console.log("Update Failed.");
      });
    setIsSubmitted(false);
  };

  return (
    <>
      <Flex
        direction={"column"}
        p={20}
        pt={11}
        textAlign={"left"}
        gap={10}
        w={1300}
        m={"0 auto"}
      >
        <Heading fontFamily={"Montserrat Variable"}>
          Account Information
        </Heading>
        <Flex
          backgroundColor="white"
          p={20}
          pt={16}
          pl={16}
          borderRadius="14px"
          align="left"
          direction="column"
          gap={16}
        >
          <Flex color="black" direction="column" gap={3}>
            <Heading fontFamily="Poppins" fontSize="26px" fontWeight="600">
              API Usage Volume
            </Heading>
            <Text fontFamily="Montserrat Variable">
              ( {1 + " / " + currentYear} - {currentMonth + " / " + currentYear}{" "}
              )
            </Text>
          </Flex>
          <GradientLineChart calls={calls} />
        </Flex>
        <Flex
          gap={5}
          backgroundColor="white"
          p={20}
          pt={16}
          pb={16}
          borderRadius={14}
          color="black"
          direction="column"
        >
          <Heading fontSize={26} mb={5} fontFamily="Montserrat Variable">
            Keys
          </Heading>
          <Flex align="center" justify="left">
            <TfiUser size={25} />
            <Text ml={"10px"}>Public Key</Text>
            <Text ml={"103px"}>{publicKey}</Text>
          </Flex>
          <Flex align="center" justify="center">
            <TfiKey size={26} />
            <Text ml={2} mr={5}>
              API Key
            </Text>
            <Spacer />
            <Text onClick={handleCopy} cursor="pointer">
              {api.slice(0, 5) + "......" + api.slice(-5)}
            </Text>
            <Spacer />
            <Text>{formatDate(timestamp)}</Text>
            <Spacer />
            <Text>Active</Text>
            <Spacer />

            <Flex
              width="150px"
              height="48px"
              p={0}
              justify="center"
              align="center"
              borderRadius="12px"
              background="linear-gradient(93.59deg, #00EAB1 -14.32%, rgba(23, 190, 194, 0.91) 12.24%, rgba(39, 158, 206, 0.65) 35.82%, rgba(61, 116, 221, 0.61) 58.92%, rgba(81, 77, 236, 0.43) 83.94%, #6B1BFF 107.82%)"
            >
              <Button
                w="95%"
                h="85%"
                borderRadius="8px"
                background="white"
                fontWeight={400}
                onClick={handleUpdateAPI}
                _hover={{}}
                _active={{
                  color: "white",
                  background:
                    "linear-gradient(93.59deg, #00EAB1 -14.32%, rgba(23, 190, 194, 0.91) 12.24%, rgba(39, 158, 206, 0.65) 35.82%, rgba(61, 116, 221, 0.61) 58.92%, rgba(81, 77, 236, 0.43) 83.94%, #6B1BFF 107.82%)",
                }}
                disabled={isSubmitted}
              >
                Regenerate
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
