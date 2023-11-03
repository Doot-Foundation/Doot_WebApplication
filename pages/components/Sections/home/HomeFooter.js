import { Flex, Box, Image, Text, Heading, Spacer } from "@chakra-ui/react";
import { RiTwitterXLine, RiGithubFill } from "react-icons/ri";
import { BsArrowUpRight } from "react-icons/bs";
import Link from "next/link";

export default function HomeFooter() {
  return (
    <>
      <Flex direction={"column"} p={20} position={"relative"}>
        <Box
          position={"absolute"}
          left={0}
          top={120}
          borderBottom={"1px solid white"}
          w={"100vw"}
          m={0}
          p={0}
          zIndex={-1}
        ></Box>
        <Flex
          direction={"row"}
          w={"100%"}
          align={"center"}
          justify={"center"}
          gap={5}
        >
          <Link href={"https://x.com/DootFoundation"} target="_blank">
            <Box
              borderRadius={"50%"}
              border={"3px solid white"}
              p={2}
              bgColor={"#0a0a0a"}
            >
              <RiTwitterXLine size={40} />
            </Box>
          </Link>
          <Link href="https://github.com/Doot-Foundation">
            <Box
              borderRadius={"50%"}
              border={"3px solid white"}
              p={2}
              bgColor={"#0a0a0a"}
            >
              <RiGithubFill size={40} />
            </Box>
          </Link>
        </Flex>
      </Flex>
      <Flex direction={"column"} p={10} bgColor={"#090909"} gap={2}>
        <Flex direction={"row"} align={"center"} gap={4}>
          <Image src="/static/images/Doot.png" boxSize={10} />
          <Heading size={"lg"} mt={2}>
            Doot
          </Heading>
          <Spacer />
          <Link href="https://zkignite.minaprotocol.com/zkignite/dev4dev/refineproposals/suggestion/567/detail">
            <Flex direction={"row"} align={"center"} gap={1}>
              <Text>Read More</Text>
              <BsArrowUpRight size={15} />
            </Flex>
          </Link>
        </Flex>
        <Text mt={1}>2023 - Present</Text>
        <Text>
          <Link href="https://zkignite.minaprotocol.com/">
            zkIgnite Cohort 2
          </Link>{" "}
          Funded Project
        </Text>
      </Flex>
    </>
  );
}
