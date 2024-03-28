import { Flex, Image, Spacer, Link } from "@chakra-ui/react";
import ConnectButton from "../common/ConnectButton";

export default function SlotsHeader() {
  return (
    <>
      <Flex>
        <Link href="/" mt={10}>
          <Image src="/static/images/Doot.png" boxSize={24} />
        </Link>
        <Spacer />
        <ConnectButton />
      </Flex>
    </>
  );
}
