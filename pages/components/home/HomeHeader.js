import { Link, Flex, Image, Spacer } from "@chakra-ui/react";
import ConnectButton from "../common/ConnectButton";

export default function HomeHeader() {
  return (
    <>
      <Flex
        width="1120px"
        height="52px"
        ml="calc(50% - 1120px/2)"
        mt="76px"
        align="center"
        justify="center"
      >
        <Image src="/static/images/DootDot.png" />
        <Spacer />
        <Flex
          direction="row"
          gap="42px"
          fontWeight="500"
          fontSize="18px"
          color="#BFBFBF"
        >
          <Link
            href="https://docs.doot.foundation/"
            target="_blank"
            _hover={{
              textDecoration: "none",
              color: "white",
            }}
          >
            Docs
          </Link>
          <Link
            href="/feeds"
            _hover={{
              color: "white",
              textDecoration: "none",
            }}
          >
            Feeds
          </Link>
          <Link
            href="/slots"
            _hover={{
              color: "white",
              textDecoration: "none",
            }}
          >
            Slots
          </Link>
          <Link
            href="/verify"
            _hover={{
              color: "white",
              textDecoration: "none",
            }}
          >
            Verify
          </Link>
          <Link
            href="/dashboard"
            _hover={{
              color: "white",
              textDecoration: "none",
            }}
          >
            Dashboard
          </Link>
        </Flex>
        <Spacer />
        <ConnectButton />
      </Flex>
    </>
  );
}
