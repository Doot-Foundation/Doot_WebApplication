import { Flex, Spacer, Image, Text, Link } from "@chakra-ui/react";
import { CgArrowTopRight } from "react-icons/cg";

export default function FeedsHeader() {
  return (
    <>
      <Flex p={"2% 8% 5% 8%"} align={"center"}>
        <Link href="/">
          <Image src="/static/images/Doot.png" boxSize={20} />
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
          >
            <Text>Verify</Text>
            <CgArrowTopRight />
          </Flex>
        </Link>
      </Flex>
    </>
  );
}
