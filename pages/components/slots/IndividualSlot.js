import {
  Flex,
  Heading,
  Text,
  Progress,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState, useContext } from "react";
import { TOKEN_TO_SYMBOL } from "../../../utils/constants/info";

import { SignerContext, ChainContext } from "../../../lib/context/contexts";

export default function IndividualSlot({ token }) {
  const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;
  const { signer, setSigner } = useContext(SignerContext);
  const { chain, setChain } = useContext(ChainContext);

  const toast = useToast();

  const axios = require("axios");
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const [timeLagError, setTimeLagError] = useState(false);

  useEffect(() => {
    async function execute() {
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
        if (
          Date.now() - response.data.information.aggregationTimestamp >
          600000
        )
          setTimeLagError(true);
      } catch (error) {
        console.error("Error fetching price:", error);
      }
    }

    execute();
  }, []);

  if (result && timeLeft == null && !timeLagError) {
    setTimeLeft(Date.now() - result.aggregationTimestamp);
  }

  useEffect(() => {
    if (timeLeft) startTimer(timeLeft);
  }, [timeLeft]);

  // Function to start the timer
  function startTimer(startingTime) {
    let timer = startingTime;

    const intervalId = setInterval(() => {
      timer--;

      if (timer === 0) {
        clearInterval(intervalId);
        window.location.reload();
      }
    }, 1000);
  }

  function normalizePrice(str) {
    let num = parseInt(str);
    num = num / Math.pow(10, 10);
    num = Math.round(num * 100) / 100;
    return num;
  }

  async function handleSign() {
    if (
      typeof window !== "undefined" &&
      window.mina &&
      result &&
      result.signature
    ) {
      const account = await window.mina.requestAccounts();
      const network = await window.mina.requestNetwork();
      setSigner(account[0]);
      setChain({ chainId: network.chainId, chainName: network.name });

      if (!account[0] || !network.chainId) {
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

      console.log(signer.toString());
      await axios
        .post(
          `/api/update/updateLatestTokenSlot?signature=${signedObj}&publicKey=${signer.toString()}&token=${token}`
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

  return (
    <>
      <Flex
        direction={"column"}
        padding={5}
        borderRadius={10}
        bgColor={"white"}
        color={"black"}
        m={10}
        gap={5}
        w={"26%"}
      >
        <Heading
          fontFamily={"Montserrat Variable"}
          borderRadius={10}
          p={1}
          w={"max-content"}
        >
          {TOKEN_TO_SYMBOL[token]}
        </Heading>
        {result && result.signature && !timeLagError && timeLeft != 0 ? (
          <>
            <Flex gap={1}>
              <Text w={"30%"}>Price</Text>
              <Text w={"70%"}>${normalizePrice(result.price)}</Text>
            </Flex>
            <Flex gap={1}>
              <Text w={"30%"}>Decimals</Text>
              <Text w={"70%"}>10</Text>
            </Flex>{" "}
            <Flex gap={1}>
              <Text w={"30%"}>Timestamp</Text>
              <Text w={"70%"}>{result.aggregationTimestamp} Epoch</Text>
            </Flex>{" "}
            <Flex gap={1}>
              <Text w={"30%"}>Sign</Text>
              <Text w={"60%"}>{result.signature.signature}</Text>
            </Flex>{" "}
            <Flex gap={1}>
              <Text w={"30%"}>Oracle</Text>
              <Text w={"70%"}>{result.signature.publicKey}</Text>
            </Flex>{" "}
            <Flex gap={1}>
              <Text w={"30%"}>Data </Text>
              <Text w={"70%"}>{result.signature.data}</Text>
            </Flex>
            <Progress max={600000} value={timeLeft}></Progress>
            <Button colorScheme="green" onClick={handleSign}>
              Join Consensus
            </Button>
          </>
        ) : (
          <Text>
            Loading Latest Slot, Please check back in a couple of minutes...
          </Text>
        )}
      </Flex>
    </>
  );
}
