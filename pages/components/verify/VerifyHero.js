import {
  Button,
  Flex,
  FormControl,
  Input,
  Select,
  Heading,
  Text,
  useToast,
  Collapse,
  Tooltip,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";

export default function VerifyHero() {
  const {
    DATA_PROVIDER_TO_ENDPOINT,
    SUPPORTED_TOKENS,
    SYMBOL_TO_TOKEN,
    PROVIDERS,
  } = require("../../../utils/constants/info");
  const toast = useToast();

  // AGGREGATED - FALSE, INDIVIDUAL - TRUE
  const [mode, setMode] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [url, setURL] = useState("");

  const [price, setPrice] = useState("");
  const [signature, setSignature] = useState("");

  useEffect(() => {
    if (selectedProvider && selectedToken)
      setURL(DATA_PROVIDER_TO_ENDPOINT(selectedProvider, selectedToken));
  }, [selectedProvider, selectedToken]);

  const handleFormSubmission = async (event) => {
    event.preventDefault();

    setIsSubmitting(true);

    if (!price && !signature) {
      setIsSubmitting(false);
      return;
    }

    if (!url && !timestamp && !mode) {
      const apiEndpoint_1 = `/api/verify/verifyAggregated?price=${price}&signature=${signature}`;
      try {
        const response = await axios.post(apiEndpoint_1);

        const status = response.data.status;
        if (status == 1)
          toast({
            title: "Verified Successfully!",
            description: "The Signature Was Generated By The Oracle Keys.",
            duration: "7000",
            status: "success",
            position: "top",
          });
        else
          toast({
            title: "Verification Failed!",
            description:
              "The Signature Did Not Originate From The Oracle Keys.",
            duration: "7000",
            status: "error",
            position: "top",
          });
        setIsSubmitting(false);
      } catch (error) {
        setIsSubmitting(false);
        console.error(error);
      }
    } else {
      if (!url || !timestamp || !mode) {
        setIsSubmitting(false);
        return;
      }

      const apiEndpoint_2 = `/api/verify/verifyIndividual?price=${price}&signature=${signature}&url=${url}&timestamp=${timestamp}&decimals=10`;

      try {
        const response = await axios.post(apiEndpoint_2);
        const status = response.data.status;
        if (status == 1)
          toast({
            title: "Verified Successfully!",
            description: "The Signature Was Generated By The Oracle Keys.",
            duration: "7000",
            status: "success",
            position: "top",
          });
        else
          toast({
            title: "Verification Failed!",
            description:
              "The Signature Did Not Originate From The Oracle Keys.",
            duration: "7000",
            status: "error",
            position: "top",
          });

        setIsSubmitting(false);
      } catch (error) {
        setIsSubmitting(false);
        console.error(error);
      }
    }
  };

  return (
    <>
      <Flex
        direction="column"
        w="1300px"
        margin="0 auto"
        p={20}
        pt={0}
        gap={20}
        mb={100}
      >
        <Flex direction={"column"} gap="43px">
          <Heading fontFamily={"Montserrat Variable"} fontWeight={600}>
            Oracle Signature Verification
          </Heading>
          <Text fontSize="24px">
            Securely verify the origins of the information you've provided. By
            using these forms, we can confirm whether the data you've submitted
            has been signed with our private keys, ensuring its integrity and
            authenticity.
          </Text>
        </Flex>
        <Flex direction={"column"} gap={10} align={"center"}>
          <Flex margin="0 auto" gap={10}>
            <Flex
              transition="0.5s"
              justify="center"
              align="center"
              background={
                mode == false
                  ? "radial-gradient(208.44% 148.88% at 50% -5%, rgba(151, 94, 255, 0.5) 0%, rgba(0, 0, 0, 0) 35.83%, rgba(245, 245, 245, 0.05) 100%)"
                  : null
              }
              color={mode == false ? "#975EFF" : "#BFBFBF"}
              border={mode == false ? "1px solid #975EFF" : "1px solid gray"}
              borderRight={mode == false ? "10px solid #975EFF" : null}
              fontWeight={700}
              borderRadius="13px 0px 0px 4px;"
              width="356px"
              height="71px"
              cursor="pointer"
              onClick={() => setMode(false)}
            >
              Aggregated Price Verification
            </Flex>
            <Flex
              transition="0.5s"
              justify="center"
              cursor="pointer"
              align="center"
              background={
                mode == true
                  ? "radial-gradient(208.44% 148.88% at 50% -5%, rgba(151, 94, 255, 0.5) 0%, rgba(0, 0, 0, 0) 35.83%, rgba(245, 245, 245, 0.05) 100%)"
                  : null
              }
              color={mode == true ? "#975EFF" : "#BFBFBF"}
              border={mode == true ? "1px solid #975EFF" : "1px solid gray"}
              borderLeft={mode == true ? "10px solid #975EFF" : null}
              borderRadius="0px 13px 4px 0px;"
              fontWeight={700}
              width="356px"
              height="71px"
              onClick={() => setMode(true)}
            >
              Individual Request Verification
            </Flex>
          </Flex>
          <form id="form" onSubmit={handleFormSubmission}>
            <FormControl
              bgColor={"#F5F5F5"}
              color={"black"}
              p={10}
              pl={20}
              pr={20}
              w="1000px"
              borderRadius={"16px"}
            >
              <Collapse in={mode}>
                <Select
                  _hover={{}}
                  _focus={{
                    borderColor: "#6B1BFF",
                  }}
                  border="2px solid #b891ff"
                  placeholder="Select a provider"
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  disabled={isSubmitting}
                  display="inline-block"
                  w="63%"
                  mr="4%"
                  mb={5}
                >
                  {PROVIDERS.map((provider, index) => (
                    <option key={index} value={provider}>
                      {provider}
                    </option>
                  ))}
                </Select>
                <Select
                  display="inline-block"
                  _hover={{}}
                  _focus={{
                    borderColor: "#6B1BFF",
                  }}
                  border="2px solid #b891ff"
                  w="33%"
                  placeholder="Select the asset"
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  disabled={isSubmitting}
                >
                  {SUPPORTED_TOKENS.map((token, index) => (
                    <option
                      key={index}
                      value={SYMBOL_TO_TOKEN[token].toUpperCase()}
                    >
                      {SYMBOL_TO_TOKEN[token].toUpperCase()}
                    </option>
                  ))}
                </Select>
                <Tooltip
                  label="The URL that was called by the Oracle."
                  borderRadius={10}
                  p={2}
                >
                  <Input
                    name="url"
                    _hover={{}}
                    _focus={{
                      borderColor: "#6B1BFF",
                    }}
                    border="2px solid #b891ff"
                    value={url}
                    placeholder="https://google.com/api/getTokenValue"
                    disabled={true}
                    mb={5}
                  />
                </Tooltip>
                <Input
                  name="timestamp"
                  _hover={{}}
                  _focus={{
                    borderColor: "#6B1BFF",
                  }}
                  border="2px solid #b891ff"
                  placeholder="Timestamp"
                  onChange={(e) => setTimestamp(e.target.value)}
                  disabled={isSubmitting}
                  mb={5}
                />
              </Collapse>
              <Input
                name="signature"
                placeholder="Signature"
                _hover={{}}
                _focus={{
                  borderColor: "#6B1BFF",
                }}
                border="2px solid #b891ff"
                onChange={(e) => setSignature(e.target.value)}
                disabled={isSubmitting}
                mb={5}
              />
              <Flex gap={5} mb={5}>
                <Input
                  name="price"
                  placeholder="Price/Data"
                  _hover={{}}
                  _focus={{
                    borderColor: "#6B1BFF",
                  }}
                  border="2px solid #b891ff"
                  w={"90%"}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isSubmitting}
                />
                <Tooltip label="Precision associated." borderRadius={10} p={2}>
                  <Input
                    name="decimals"
                    placeholder="Decimals"
                    _hover={{}}
                    _focus={{
                      borderColor: "#6B1BFF",
                    }}
                    border="2px solid #b891ff"
                    value={10}
                    disabled={true}
                    w={"10%"}
                  />
                </Tooltip>
              </Flex>
              <Flex w="100%" justify="center">
                <Button
                  type="submit"
                  w={"30%"}
                  background="linear-gradient(93.52deg, #00EAB1 -14.28%, rgba(23, 190, 194, 0.91) 10.57%, rgba(39, 158, 206, 0.65) 39.37%, rgba(61, 116, 221, 0.61) 54.25%, rgba(81, 77, 236, 0.43) 77.66%, #6B1BFF 100%)"
                  color="white"
                  disabled={isSubmitting}
                  _hover={{}}
                  _active={{}}
                >
                  Submit
                </Button>
              </Flex>
            </FormControl>
          </form>
        </Flex>
      </Flex>
    </>
  );
}
