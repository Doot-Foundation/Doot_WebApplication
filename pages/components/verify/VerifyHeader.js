import { Image, Spacer, Flex, Link, Box } from "@chakra-ui/react";

export default function VerifyHeader() {
  return (
    <>
      <Flex p="5% 7%">
        <Link href="/">
          <Image src="/static/images/Doot.png" boxSize={20} />
        </Link>
        <Spacer />
        <Box />
      </Flex>
    </>
  );
}
