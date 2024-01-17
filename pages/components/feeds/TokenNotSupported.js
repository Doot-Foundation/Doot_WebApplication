import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  Text,
  useDisclosure,
} from "@chakra-ui/react";

import { useEffect } from "react";

export default function TokenNotSupported({ token }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    onOpen();
  }, []);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size={"xl"}>
        <ModalOverlay bg="rgba(0, 0, 0, 0.9)" />
        <ModalContent
          color={"white"}
          bg="linear-gradient(180deg, rgba(42,0,82,1) 0%, rgba(71,30,127,1) 50%, rgba(83,0,188,1) 100%)"
        >
          <ModalHeader fontSize={80} fontFamily={"Montserrat Variable"}>
            Oops!
          </ModalHeader>
          <ModalBody p={5}>
            <Text fontWeight={600}>
              It Looks Like We Are Not Tracking{" "}
              <span style={{ color: "orange" }}>'{token}'</span>
              Just Yet :(
            </Text>
            <br />
            <Text>
              As of now, we only support limited tokens. We sincerly aplogize
              and hope to cover them soon.
            </Text>
            <br />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
