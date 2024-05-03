import {
  Flex,
  Text,
  Progress,
  Button,
  Image,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { TOKEN_TO_SYMBOL } from "../../../utils/constants/info";

import TimePassed from "./TimePassed";

import { useSelector } from "react-redux";

export default function IndividualSlot({ token }) {
  const axios = require("axios");
  const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

  const signer = useSelector((state) => state.network.signer);
  const chainName = useSelector((state) => state.network.chainName);

  const toast = useToast();

  const [result, setResult] = useState(null);
  const [timePassed, setTimePassed] = useState(null);

  const [timeLagError, setTimeLagError] = useState(false);
  const src = `/static/slot_token/${token}.png`;

  async function fetchInitDetails() {
    try {
      const headers = {
        Authorization: "Bearer " + key,
      };
      const response = await axios.get(
        `/api/get/getLatestTokenSlot?token=${token}`,
        {
          headers: headers,
        }
      );
      setResult(response.data.information);
      if (Date.now() - response.data.information.aggregationTimestamp > 600000)
        setTimeLagError(true);
      else {
        setTimePassed(
          Math.floor(
            (Date.now() - response.data.information.aggregationTimestamp) / 1000
          )
        );
      }
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  }

  useEffect(() => {
    fetchInitDetails();
  }, []);

  useEffect(() => {
    if (timePassed <= 600) {
      let interval = null;
      interval = setInterval(() => {
        setTimePassed((timePassed) => timePassed + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeout(() => {
        fetchInitDetails();
      }, 20000);
    }
  }, [timePassed]);

  function normalizePrice(str) {
    let num = parseInt(str);
    num = num / Math.pow(10, 10);
    num = Math.round(num * 100) / 100;
    return num;
  }

  async function handleSign() {
    if (result && result.signature) {
      if (!signer || !chainName) {
        toast({
          title: "Wallet Not Connected!",
          status: "info",
        });
        return;
      }

      var toSignObject = {
        data: result.signature.data.toString(),
        publicKey: result.signature.publicKey.toString(),
        signature: result.signature.signature.toString(),
      };

      toSignObject = JSON.stringify(toSignObject);

      var signedObj = await window.mina.signMessage({
        message: toSignObject,
      });
      signedObj = JSON.stringify(signedObj);

      await axios
        .post(
          `/api/update/updateLatestTokenSlot?signature=${signedObj}&publicKey=${account.toString()}&token=${token}`
        )
        .then((res) => {
          if (res.data.status == 1) {
            toast({
              title: "Signed and Confirmed Successfully!",
              duration: "7000",
              status: "success",
              position: "top",
            });
          }
        })
        .catch((err) => {
          toast({
            title: "Failed. Please try again!",
            status: "error",
            position: "top",
          });
        });
    } else return;
  }

  function capitalizeFirstLetter(word) {
    if (word) return word.charAt(0).toUpperCase() + word.slice(1);
    else return "";
  }

  useEffect(() => {}, [timePassed]);

  return (
    <>
      <Flex
        h={600}
        direction={"column"}
        padding={"30px"}
        pt={"48px"}
        borderRadius={20}
        bgColor={"#202020"}
        color={"white"}
        gap={5}
      >
        <Flex gap={5}>
          <Image src={src} h={34} w={34} />
          <Text fontSize="24px" fontFamily={"Montserrat Variable"}>
            {capitalizeFirstLetter(token) + "/" + TOKEN_TO_SYMBOL[token]}
          </Text>
        </Flex>
        {result && result.signature && !timeLagError && timePassed <= 600 ? (
          <>
            <Flex gap={10}>
              <Flex direction="column" gap={7} w="35%">
                <Flex direction="column">
                  <Text fontSize="18px" color="#BFBFBF">
                    Price
                  </Text>
                  <Text fontSize="16px">${normalizePrice(result.price)}</Text>
                </Flex>
                <Flex direction="column">
                  <Text color="#BFBFBF" fontSize="18px">
                    Decimals
                  </Text>
                  <Text fontSize="16px">10</Text>
                </Flex>
                <Flex direction="column">
                  <Text color="#BFBFBF" fontSize="18px">
                    {" "}
                    Timestamp
                  </Text>
                  <Text fontSize="16px">
                    {result.aggregationTimestamp} Epoch
                  </Text>
                </Flex>
                <Flex direction="column">
                  <Text color="#BFBFBF" fontSize="18px">
                    Data{" "}
                  </Text>
                  <Text fontSize="16px">{result.signature.data}</Text>
                </Flex>
              </Flex>
              <Flex
                direction="column"
                w="60%"
                gap={7}
                borderLeft="1px solid white"
                pl={10}
              >
                <Flex direction="column">
                  <Text color="#BFBFBF" fontSize="18px">
                    Sign
                  </Text>
                  <Text fontSize="16px">{result.signature.signature}</Text>
                </Flex>
                <Flex direction="column">
                  <Text color="#BFBFBF" fontSize="18px">
                    Oracle Public Key
                  </Text>
                  <Text fontSize="16px">{result.signature.publicKey}</Text>
                </Flex>
              </Flex>
            </Flex>
            <Flex justify="right">
              <Flex
                width="193px"
                height="50px"
                justify="center"
                align="center"
                borderRadius="12px"
                background="linear-gradient(93.59deg, #00EAB1 -14.32%, rgba(23, 190, 194, 0.91) 12.24%, rgba(39, 158, 206, 0.65) 35.82%, rgba(61, 116, 221, 0.61) 58.92%, rgba(81, 77, 236, 0.43) 83.94%, #6B1BFF 107.82%)"
              >
                <Button
                  w="190px"
                  h="47px"
                  borderRadius="11px"
                  background="#202020"
                  color="white"
                  fontWeight={400}
                  onClick={handleSign}
                  fontSize={20}
                  _hover={{
                    background:
                      "linear-gradient(93.59deg, #00EAB1 -14.32%, rgba(23, 190, 194, 0.91) 12.24%, rgba(39, 158, 206, 0.65) 35.82%, rgba(61, 116, 221, 0.61) 58.92%, rgba(81, 77, 236, 0.43) 83.94%, #6B1BFF 107.82%)",
                  }}
                  _active={{
                    background:
                      "linear-gradient(93.59deg, #00EAB1 -14.32%, rgba(23, 190, 194, 0.91) 12.24%, rgba(39, 158, 206, 0.65) 35.82%, rgba(61, 116, 221, 0.61) 58.92%, rgba(81, 77, 236, 0.43) 83.94%, #6B1BFF 107.82%)",
                  }}
                  disabled={timePassed > 600 ? true : false}
                >
                  Join Consensus
                </Button>
              </Flex>
            </Flex>
            <Flex direction="column" gap={2}>
              <TimePassed timestamp={600 - timePassed} />
              <Progress
                hasStripe
                isAnimated
                max={600}
                min={0}
                value={600 - timePassed}
                colorScheme="purple"
                borderRadius="20px"
              ></Progress>
            </Flex>
          </>
        ) : (
          <Flex
            direction="column"
            h="100%"
            w="100%"
            align="center"
            justify="center"
            gap={5}
          >
            <Image src="/static/animation/loading.gif" />
            <Text fontSize="16px" w="fit-content">
              Fetching slot details...
            </Text>
          </Flex>
        )}
      </Flex>
    </>
  );
}
