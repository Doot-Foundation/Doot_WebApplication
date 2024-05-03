import {
  Collapse,
  Flex,
  useDisclosure,
  Heading,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";

import IndividualSlot from "./IndividualSlot";
import { TOKEN_TO_CACHE } from "../../../utils/constants/info";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

export default function SlotsHero() {
  const { isOpen, onToggle } = useDisclosure();

  const tokens = Object.keys(TOKEN_TO_CACHE);

  return (
    <>
      <Flex
        direction="column"
        w="1300px"
        m="0 auto"
        p={20}
        pt={10}
        gap={5}
        mb={100}
      >
        <Heading fontFamily="Montserrat Variable">Slots</Heading>
        <Flex mb={2}>
          <Text fontSize="24px">
            Participate in this community consensus to support the protocol's
            decentralization initiative and help strengthen the community. This
            won't cost any Mina.
          </Text>
          {!isOpen ? (
            <IoIosArrowDown size={50} cursor={"pointer"} onClick={onToggle} />
          ) : (
            <IoIosArrowUp size={50} cursor={"pointer"} onClick={onToggle} />
          )}
        </Flex>
        <Collapse fontSize="24px" in={isOpen} animateOpacity>
          Upon clicking the "Join Consensus" button for a specific token, you
          become an active participant in the consensus process. Your
          involvement enhances the security and decentralization of Doot,
          thereby contributing to its robustness and reliability. This process
          involves a query to determine if you trust the generated data for a
          specific time interval, followed by a request to sign over this data
          if you do. Slots that have been signed over the most within a
          30-minute span are prioritized when considered for historical
          information. Similarly, slots that have been signed over the most
          within a 2-hour span are given priority when being considered for
          on-chain inclusion.
        </Collapse>
        <SimpleGrid
          mt={20}
          columns={2}
          spacingX={6}
          spacingY={12}
          justifyContent="center"
        >
          {tokens.map((token, index) => {
            return <IndividualSlot key={index} token={token} />;
          })}
        </SimpleGrid>
      </Flex>
    </>
  );
}
