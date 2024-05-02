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

import { useEffect, useState, useContext } from "react";

import { SignerContext } from "../../../lib/context/contexts";

import axios from "axios";

import Profile from "./Profile";

export default function DashboardHero() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;
  const { signer } = useContext(SignerContext);

  const [userStatus, setUserStatus] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    if (signer) checkUserStatus();
  }, [signer]);

  async function checkUserStatus() {
    try {
      const res = await axios.get(`/api/get/getUserStatus?address=${signer}`);
      setUserStatus(res.data.status);
      if (res.data.status == 0) onOpen();
    } catch (error) {
      console.log("Failed Fetching The Status.");
    }
  }

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
      .get(`/api/addUser?address=${signer}`, {
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

      await axios
        .get(
          `/api/get/getUserInformation?address=${signer}&timestamp=${timestamp}`,
          {
            headers: headers,
          }
        )
        .then((res) => {
          const data = JSON.parse(res.data);
          setUserDetails(data);
        })
        .catch((err) => {
          console.log("Verification Failed.");
        });
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
          mt="17%"
          borderRadius="14px"
          color={"black"}
          justify="center"
          align="center"
          p={5}
        >
          <ModalHeader
            textAlign="center"
            fontSize="24px"
            fontFamily="Montserrat Variable"
          >
            Welcome aboard!
          </ModalHeader>
          <ModalBody
            textAlign="center"
            textShadow="2px 2px 4px rgba(0, 0, 0, 0.3)"
            fontSize="20px"
          >
            It seems you're new here! <br />
            We're excited to guide you through your journey with Doot for the
            Mina Protocol.
          </ModalBody>
          <ModalFooter>
            <Flex
              m={"0 auto"}
              w="154px"
              h="61px"
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
      <Flex mb={100}>{userDetails && <Profile info={userDetails} />}</Flex>
    </>
  );
}
