import {
  Flex,
  Heading,
  Text,
  Box,
  Spacer,
  useToast,
  Button,
} from "@chakra-ui/react";
import { CiUser } from "react-icons/ci";
import { TfiKey, TfiUser } from "react-icons/tfi";
import GradientLineChart from "./GradientLineChart";

export default function Profile({ info }) {
  const publicKey = info ? info.address : null;
  const timestamp = info ? info.created_at : null;
  const api = info ? info.generated_key : null;
  const plan = info ? info.plan : null;
  const calls = info ? JSON.parse(info.calls) : null;

  const toast = useToast();

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
            <Text ml={2} mr={5} fontWeight="700">
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
            <Button>Regenrate</Button>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
