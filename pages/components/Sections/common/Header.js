import { Link, Flex, Image, Spacer } from "@chakra-ui/react";
import ConnectButton from "./ConnectButton";
import { CgArrowTopRight } from "react-icons/cg";

export default function Header() {
  return (
    <>
      <Flex p="5% 7%">
        <Image src="/static/images/Doot.png" boxSize={20} />
        <Spacer />
        <Flex direction={"row"} align={"center"}>
          <Flex direction={"row"} gap={10} mr={10}>
            <Flex
              direction={"row"}
              gap={1}
              _hover={{ color: "#94ffe5", cursor: "pointer" }}
            >
              <Link
                href="/feeds"
                _hover={{
                  textDecoration: "none",
                }}
              >
                Feeds
              </Link>
              <CgArrowTopRight />
            </Flex>
            <Flex direction={"row"} gap={1} _hover={{ color: "#94ffe5" }}>
              <Link
                href="/dashboard"
                _hover={{
                  textDecoration: "none",
                }}
              >
                Dashboard
              </Link>
              <CgArrowTopRight />
            </Flex>
          </Flex>
          <ConnectButton />
        </Flex>
      </Flex>
    </>
  );
}
