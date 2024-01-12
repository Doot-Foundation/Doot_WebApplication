import {
  Flex,
  Heading,
  Link,
  Spacer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@chakra-ui/react";

import { useEffect, useState, useContext } from "react";

import { SignerContext } from "../../../lib/context/contexts";

import axios from "axios";

import MenuItem from "./MenuItem";
import Profile from "./Profile";

import { HiHome } from "react-icons/hi2";
import ConnectButton from "../common/ConnectButton";

export default function DashboardHero() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;
  const { signer } = useContext(SignerContext);

  const [page, setPage] = useState("profile");
  const [userStatus, setUserStatus] = useState(undefined);
  const [userDetails, setUserDetails] = useState(undefined);

  useEffect(() => {
    if (signer) checkUserStatus();
  }, [signer]);

  async function checkUserStatus() {
    const headers = {
      Authorization: "Bearer " + key,
    };
    try {
      const res = await axios.get(`/api/get/getUserStatus?address=${signer}`, {
        headers: headers,
      });
      setUserStatus(res.data.status);
      if (res.data.status == 0) onOpen();
    } catch (error) {
      console.log("Failed Fetching The Status.");
    }
  }

  if (userStatus == 1 && userDetails == undefined) {
    getUserDetails();
  }

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
        console.log(res.data);
      });
  };

  async function getUserDetails() {
    const timestamp = Date.now();
    const toVerifyMessage = `Sign this message to prove you have access to this wallet in order to sign in to doot.foundation/dashboard. This won't cost you any Mina. Timestamp:${timestamp}`;
    const signedObj = await window.mina?.signMessage({
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
        console.log(res.data);
        const data = JSON.parse(res.data);
        setUserDetails(data);
      });
  }

  if (userDetails) console.log(userDetails);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent color={"black"} mt={200} fontFamily={"Manrope Variable"}>
          <ModalHeader>Good to see you here! :D</ModalHeader>
          <ModalBody>
            It looks like you are a new user and we would love to onboard you
            and help obtain your key to the gateway of amazing asset feeds for
            the Mina Protocol by Doot.
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleOnboard}>
              Onboard
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Flex h={"100vh"}>
        <Flex
          direction={"column"}
          h={"100%"}
          w={"20%"}
          bgColor={"#3f007a"}
          align={"center"}
          gap={100}
          p={10}
        >
          <Link href="/" p={3} bgColor={"white"} borderRadius={20} mt={10}>
            <Heading fontFamily="Montserrat Variable" color={"#6b1bff"}>
              Doot
            </Heading>
          </Link>
          <Flex>
            <MenuItem>
              <HiHome size={20} />
              Dashboard
            </MenuItem>
          </Flex>
        </Flex>

        <Flex direction={"column"} bgColor={"#2c0055"} w={"80%"}>
          <Flex p={5}>
            <Flex />
            <Spacer />
            <ConnectButton />
          </Flex>
          {userDetails && <Profile info={userDetails} />}
        </Flex>
      </Flex>
    </>
  );
}
