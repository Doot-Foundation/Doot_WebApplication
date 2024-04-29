import {
  Button,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  Text,
} from "@chakra-ui/react";
import { IoExtensionPuzzleOutline } from "react-icons/io5";

export default function WalletError({ isOpen, onClose }) {
  const handleRedirect = () => {
    window.open("https://www.aurowallet.com/", "_blank");
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size={"xl"}>
        <ModalOverlay bg="rgba(0, 0, 0, 0.9)" />
        <ModalContent
          p={4}
          color={"white"}
          bg="linear-gradient(180deg, rgba(42,0,82,1) 0%, rgba(71,30,127,1) 50%, rgba(83,0,188,1) 100%)"
        >
          <ModalHeader fontSize={80} fontFamily="Montserrat Variable">
            Oops!
          </ModalHeader>
          <ModalBody>
            <Text>It Looks Like You Don't Have Auro Wallet :(</Text>
            <br />
            <Text>
              As of now, we only support Auro Wallet. If you wish to use our
              platform please consider installing the extension.
            </Text>
            <br />
            <Button onClick={handleRedirect} float={"right"}>
              <Flex direction={"row"} gap={2}>
                <Text>Install</Text> <IoExtensionPuzzleOutline />
              </Flex>
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
