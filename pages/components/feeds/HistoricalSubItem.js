import { Tr, Td, useToast } from "@chakra-ui/react";
import {
  ENDPOINT_TO_DATA_PROVIDER,
  MULTIPLICATION_FACTOR,
} from "../../../utils/constants/info";

export default function HistoricalSubItem({
  index,
  collectiveSignature,
  collectivePrice,
  collectiveTimestamp,
  url,
  price_returned,
  signature,
  timestamp,
}) {
  const toast = useToast();

  const handleCopyCollectiveSignature = async () => {
    try {
      await navigator.clipboard.writeText(collectiveSignature);
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

  const handleCopySignature = async () => {
    try {
      await navigator.clipboard.writeText(signature.signature);
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

  function urlToProvider(url) {
    const keys = Object.keys(ENDPOINT_TO_DATA_PROVIDER);
    for (let key of keys) {
      if (url.includes(key)) {
        return ENDPOINT_TO_DATA_PROVIDER[key];
      }
    }
    return url;
  }

  function processFloatString(input) {
    const floatValue = parseFloat(input);

    if (isNaN(floatValue)) {
      return "Invalid input";
    }

    const multipliedValue = floatValue * Math.pow(10, MULTIPLICATION_FACTOR);
    const integerValue = Math.floor(multipliedValue);
    const resultString = integerValue.toString();

    return resultString;
  }

  return (
    <>
      <Tr fontFamily={"Manrope Variable"} p={2}>
        <Td>{index + 1}</Td>
        <Td
          onClick={handleCopyCollectiveSignature}
          _hover={{ cursor: "pointer" }}
        >
          {collectiveSignature.slice(0, 4) +
            "..." +
            collectiveSignature.slice(-4)}
        </Td>
        <Td>{collectivePrice}</Td>
        <Td>{collectiveTimestamp}</Td>
        <Td>{urlToProvider(url)}</Td>
        <Td>{processFloatString(price_returned)}</Td>
        <Td onClick={handleCopySignature} _hover={{ cursor: "pointer" }}>
          {signature["signature"].slice(0, 4) +
            "..." +
            signature["signature"].slice(-4)}
        </Td>
        <Td>{timestamp}</Td>
      </Tr>
    </>
  );
}
