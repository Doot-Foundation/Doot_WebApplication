import {
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Box,
  Button,
  useDisclosure,
} from "@chakra-ui/react";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import axios from "axios";

import Profile from "./Profile";
import WalletNotConnected from "./WalletNotConnected";

export default function DashboardHero() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;

  const [userStatus, setUserStatus] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  const signer = useSelector((state) => state.network.signer);

  async function checkUserStatus() {
    try {
      const res = await axios.get(
        `/api/get/user/getUserStatus?address=${signer}`
      );
      setUserStatus(res.data.status);
      if (res.data.status == false) onOpen();
    } catch (error) {
      console.log("Failed Fetching The Status.");
    }
  }

  useEffect(() => {
    if (signer) checkUserStatus();
  }, [signer]);

  useEffect(() => {
    if (userStatus == 1 && userDetails == null) {
      getUserDetails();
    }
  }, [userStatus, userDetails]);

  const handleOnboard = async () => {
    onClose();

    const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;
    const headers = {
      Authorization: `Bearer ${key}`,
    };

    await axios
      .get(`/api/update/user/initUser?address=${signer}`, {
        headers: headers,
      })
      .then((res) => {
        window.location.reload();
      });
  };

  async function getUserDetails() {
    if (typeof window !== "undefined" && window.mina) {
      const timestamp = Date.now();
      const toVerifyMessage = `Sign this message to prove you have access to this wallet in order to sign in to doot.foundation/dashboard. This won't cost you any Mina. Timestamp:${timestamp}`;
      const signedObj = await window.mina.signMessage({
        message: toVerifyMessage,
      });
      signedObj.timestamp = timestamp;
      const finalObj = JSON.stringify(signedObj);

      const headers = {
        Authorization: "Bearer " + key,
        Signed: finalObj,
      };

      try {
        const res = await axios.get(
          `/api/get/user/getUserInformation?address=${signer}&timestamp=${timestamp}`,
          {
            headers: headers,
          }
        );
        console.log(res.data);

        // const data = JSON.parse(res.data.data);
        setUserDetails(res.data.data);
      } catch (err) {
        console.log("Something went wrong!");
      }
    } else return;
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay
          bg="rgba(0, 0, 0, 0.5)" // This sets the background to semi-transparent black
          backdropFilter="blur(10px)"
        />
        <ModalContent
          mt={{ base: "20%", md: "17%" }}
          borderRadius="14px"
          color={"black"}
          justify="center"
          align="center"
          p={{ base: 4, md: 5 }}
          maxW={{ base: "90%", md: "lg" }}
        >
          <ModalHeader
            textAlign="center"
            fontSize={{ base: "20px", md: "24px" }}
            fontFamily="Montserrat Variable"
          >
            Welcome aboard!
          </ModalHeader>
          <ModalBody
            textAlign="center"
            textShadow="2px 2px 4px rgba(0, 0, 0, 0.3)"
            fontSize={{ base: "16px", md: "20px" }}
          >
            It seems you're new here! <br />
            We're excited to guide you through your journey with Doot for the
            Mina Protocol.
          </ModalBody>
          <ModalFooter>
            <Flex
              m={"0 auto"}
              w={{ base: "200px", md: "154px" }}
              h={{ base: "48px", md: "61px" }}
              position="relative"
              p="2px"
              justify="center"
              align="center"
              borderRadius="10px"
              overflow="hidden"
            >
              <Box
                position="absolute"
                h={"100%"}
                w={"100%"}
                backgroundImage="linear-gradient(93.59deg, #00EAB1 -14.32%, rgba(23, 190, 194, 0.91) 12.24%, rgba(39, 158, 206, 0.65) 35.82%, rgba(61, 116, 221, 0.61) 58.92%, rgba(81, 77, 236, 0.43) 83.94%, #6B1BFF 107.82%)"
              />
              <Button
                borderRadius="10px"
                _hover={{
                  background:
                    "linear-gradient(93.59deg, #00EAB1 -14.32%, rgba(23, 190, 194, 0.91) 12.24%, rgba(39, 158, 206, 0.65) 35.82%, rgba(61, 116, 221, 0.61) 58.92%, rgba(81, 77, 236, 0.43) 83.94%, #6B1BFF 107.82%)",
                  color: "white",
                }}
                transition="0.2s"
                _active={{}}
                h="100%"
                w="100%"
                backgroundColor="white"
                fontWeight="500"
                onClick={handleOnboard}
              >
                Get Started
              </Button>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Flex mb={100}>
        {userDetails ? <Profile info={userDetails} /> : <WalletNotConnected />}
      </Flex>
    </>
  );
}
