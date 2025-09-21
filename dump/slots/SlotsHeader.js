import { Flex, Image, Spacer, Link } from "@chakra-ui/react";
import ConnectButton from "../common/ConnectButton";

export default function SlotsHeader() {
  return (
    <>
      <Flex p={"2% 8% 5% 8%"} align={"center"}>
        <Link href="/">
          <Image src="/static/images/Doot.png" boxSize={20} />
        </Link>
        <Spacer />
        <ConnectButton />
      </Flex>
    </>
  );
}
