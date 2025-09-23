import {
  Flex,
  Heading,
  Text,
  Spacer,
  useToast,
  Button,
  Tooltip,
} from "@chakra-ui/react";

import { TfiKey, TfiUser } from "react-icons/tfi";
import GradientLineChart from "./GradientLineChart";

import { useState } from "react";
import { useSelector } from "react-redux";

export default function Profile({ info = {} }) {
  const signer = useSelector((state) => state.network.signer);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [api, setAPI] = useState(info ? info.generated_key : null);
  const toast = useToast();

  const axios = require("axios");

  let publicKey = null;
  let timestamp = null;
  let calls = null;
  try {
    publicKey = info ? (info.address ? info.address : null) : null;
    timestamp = info ? (info.created_at ? info.created_at : null) : null;
    calls =
      info.calls && typeof info.calls === "string"
        ? JSON.parse(info.calls)
        : null;
  } catch (err) {
    console.log("Unable to update state variables appropriately.");
  }

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
        p={{ base: 6, md: 10, lg: 20 }}
        pt={{ base: 6, md: 11 }}
        textAlign={"left"}
        gap={{ base: 6, md: 10 }}
        maxW={1300}
        w={"100%"}
        m={"0 auto"}
      >
        <Heading fontFamily={"Montserrat Variable"}>User Dashboard</Heading>
        <Flex
          backgroundColor="white"
          p={{ base: 6, md: 10, lg: 20 }}
          pt={{ base: 6, md: 16 }}
          pl={{ base: 6, md: 16 }}
          borderRadius="14px"
          align="left"
          direction="column"
          gap={{ base: 8, md: 16 }}
        >
          <Flex color="black" direction="column" gap={3}>
            <Heading
              fontFamily="Poppins"
              fontSize={{ base: "20px", md: "24px", lg: "26px" }}
              fontWeight="600"
            >
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
          gap={{ base: 4, md: 5 }}
          backgroundColor="white"
          p={{ base: 6, md: 12, lg: 16 }}
          borderRadius={14}
          color="black"
          direction="column"
        >
          <Heading fontSize={26} mb={5} fontFamily="Montserrat Variable">
            Keys
          </Heading>
          <Flex
            direction={{ base: "column", md: "row" }}
            gap={{ base: 6, md: 0 }}
          >
            <Flex direction="column" w={{ base: "100%", md: "20%" }} gap={7}>
              <Flex gap={2}>
                <TfiUser size={25} />
                <Text ml={"10px"}>Public Key</Text>
              </Flex>
              <Flex gap={2}>
                <TfiKey size={26} />
                <Text ml={2} mr={5}>
                  API Key
                </Text>
              </Flex>
            </Flex>
            <Flex direction="column" w={{ base: "100%", md: "80%" }} gap={5}>
              <Text>{publicKey}</Text>

              <Flex align="center" gap={{ base: 4, md: 0 }}>
                {api ? (
                  <>
                    <Tooltip label={api} placement="top">
                      <Text
                        onClick={handleCopy}
                        cursor="pointer"
                        letterSpacing="1px"
                        fontWeight="500"
                        flex="1"
                      >
                        <Text display={{ base: "block", md: "none" }}>
                          {api
                            ? api.slice(0, 2) + " ..... " + api.slice(-2)
                            : null}
                        </Text>
                        <Text display={{ base: "none", md: "inline" }}>
                          {api
                            ? api.slice(0, 6) + "....." + api.slice(-6)
                            : null}
                        </Text>
                      </Text>
                    </Tooltip>
                  </>
                ) : null}

                <Spacer display={{ base: "none", md: "block" }} />
                <Text display={{ base: "none", md: "block" }}>
                  {formatDate(timestamp)}
                </Text>
                <Spacer display={{ base: "none", md: "block" }} />
                <Text display={{ base: "none", md: "block" }}>
                  {api ? "Active" : "NA"}
                </Text>
                <Spacer display={{ base: "none", md: "block" }} />
                <Flex
                  width={{ base: "120px", md: "150px" }}
                  height={{ base: "40px", md: "48px" }}
                  p={0}
                  justify="center"
                  align="center"
                  borderRadius="12px"
                  background="linear-gradient(93.59deg, #00EAB1 -14.32%, rgba(23, 190, 194, 0.91) 12.24%, rgba(39, 158, 206, 0.65) 35.82%, rgba(61, 116, 221, 0.61) 58.92%, rgba(81, 77, 236, 0.43) 83.94%, #6B1BFF 107.82%)"
                  flexShrink={0}
                >
                  <Button
                    w="95%"
                    h="85%"
                    borderRadius="8px"
                    background="white"
                    fontWeight={400}
                    fontSize={{ base: "sm", md: "md" }}
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
        </Flex>
      </Flex>
    </>
  );
}
