import { Flex, Heading, Text, Box, Spacer, useToast } from "@chakra-ui/react";
import { PiUserRectangle } from "react-icons/pi";

export default function Profile({ info }) {
  const publicKey = info ? info.address : null;
  const timestamp = info ? info.created_at : null;
  const api = info ? info.generated_key : null;
  const plan = info ? info.plan : null;

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

  return (
    <>
      <Flex direction={"column"} p={20} pt={14} textAlign={"left"} gap={20}>
        <Flex direction={"column"}>
          <Heading fontFamily={"Montserrat Variable"}>Dashboard</Heading>
          <Text fontFamily={"Manrope Variable"} fontWeight={400}>
            Easily view important details about your account...
          </Text>
        </Flex>
        <Flex direction={"column"} gap={5}>
          <Flex
            direction={"row"}
            gap={3}
            align={"center"}
            w={"fit-content"}
            p={3}
            bgColor={"white"}
            borderRadius={10}
            fontWeight={800}
          >
            <PiUserRectangle color="#6c35de" size={30} />
            <Text color={"black"}>{publicKey}</Text>
          </Flex>
          <Flex gap={5}>
            <Flex
              h={"fit-content"}
              direction={"column"}
              p={3}
              pl={5}
              pr={5}
              borderRadius={10}
              align={"center"}
              bgColor={"white"}
              color={"black"}
              justify={"center"}
              gap={2}
            >
              <Text
                borderBottom={"1px solid black"}
                fontWeight={700}
                w={"100%"}
                textAlign={"center"}
              >
                Created On
              </Text>
              <Text>{formatDate(timestamp)}</Text>
            </Flex>
            <Flex
              h={"fit-content"}
              direction={"column"}
              p={3}
              pl={5}
              pr={5}
              borderRadius={10}
              align={"center"}
              bgColor={"white"}
              color={"black"}
              justify={"center"}
              gap={2}
            >
              <Text
                borderBottom={"1px solid black"}
                fontWeight={700}
                w={"100%"}
                textAlign={"center"}
              >
                Plan
              </Text>
              <Text>{plan == "10" ? "Premium" : "Free"}</Text>
            </Flex>
          </Flex>
          <Flex mt={5} maxW={"fit-content"} minW={"70%"} direction={"column"}>
            <Flex
              p={2}
              bgColor={"#6c35de"}
              w={"100%"}
              gap={1}
              textAlign={"left"}
              align={"center"}
              borderTopRadius={20}
            >
              <Flex gap={2} ml={2}>
                <Box
                  borderRadius={"50%"}
                  boxSize={3}
                  backgroundColor={"green.300"}
                ></Box>
                <Box
                  borderRadius={"50%"}
                  boxSize={3}
                  backgroundColor={"orange"}
                ></Box>
                <Box
                  borderRadius={"50%"}
                  boxSize={3}
                  backgroundColor={"red"}
                ></Box>
              </Flex>
              <Spacer />
              <Text fontFamily={"Source Code Pro Variable"} mr={2}>
                api_key.html
              </Text>
            </Flex>
            <Flex
              p={10}
              h={"40%"}
              bgColor={"white"}
              borderBottomRadius={20}
              align={"center"}
              justify={"center"}
              color={"black"}
            >
              <Text
                fontWeight={600}
                onClick={handleCopy}
                _hover={{ cursor: "pointer" }}
              >
                {api}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
