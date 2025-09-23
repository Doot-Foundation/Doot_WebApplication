import { Flex, Spacer, Image, Text, Link } from "@chakra-ui/react";
import { CgArrowTopRight } from "react-icons/cg";

export default function FeedsHeader() {
  return (
    <>
      <Flex p={{ base: 4, md: "2% 8% 5% 8%" }} align={"center"} w="100%">
        <Link href="/">
          <Image src="/static/images/Doot.png" alt="Doot" boxSize={{ base: 10, md: 20 }} />
        </Link>
        <Spacer />
        <Link
          href="/verify"
          _hover={{
            textDecoration: "none",
          }}
        >
          <Flex
            gap={1}
            direction={"row"}
            _hover={{ color: "#94ffe5", cursor: "pointer" }}
            fontSize={{ base: "sm", md: "md" }}
          >
            <Text>Verify</Text>
            <CgArrowTopRight />
          </Flex>
        </Link>
      </Flex>
    </>
  );
}
