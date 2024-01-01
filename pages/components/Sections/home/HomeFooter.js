import {
  Button,
  Flex,
  Box,
  Image,
  Text,
  Heading,
  Spacer,
} from "@chakra-ui/react";
import { RiTwitterXLine, RiGithubFill } from "react-icons/ri";
import { LuMailPlus } from "react-icons/lu";
import { CgArrowTopRight } from "react-icons/cg";
import Link from "next/link";

export default function HomeFooter() {
  return (
    <>
      <Flex direction={"column"} gap={10} h={"fit-content"} mb={20}>
        <Flex direction={"column"} align={"center"} gap={5}>
          <Heading
            fontFamily={"Montserrat Variable"}
            w={"50%"}
            textAlign={"center"}
          >
            Are you ready to seemlesly integrate Doot with your next
            revolutionary zkApp?
          </Heading>
          <Button
            w={"fit-content"}
            fontFamily={"Source Code Pro Variable"}
            colorScheme="yellow"
            borderRadius={20}
          >
            Contact Us
          </Button>
        </Flex>
        <Flex direction={"column"} position={"relative"}>
          <Box
            position={"absolute"}
            left={0}
            top={"50%"}
            borderBottomRadius={"100%"}
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
            </Link>{" "}
            <Link href={"https://x.com/DootFoundation"} target="_blank">
              <Box
                borderRadius={"50%"}
                border={"3px solid white"}
                p={2}
                bgColor={"#0a0a0a"}
              >
                <LuMailPlus size={40} />
              </Box>
            </Link>
          </Flex>
        </Flex>
        <Flex direction={"row"}>
          <Flex direction={"column"} p={10} gap={2}>
            <Flex direction={"row"} align={"center"} gap={4}>
              <Image src="/static/images/Doot.png" boxSize={10} />
              <Heading
                size={"lg"}
                color={"#a364ff"}
                fontFamily={"Montserrat Variable"}
              >
                Doot
              </Heading>
            </Flex>
            <Text mt={1}>2023 - Present</Text>
            <Text>
              <Link href="https://zkignite.minaprotocol.com/" target="_blank">
                zkIgnite Cohort 2
              </Link>{" "}
              Funded Project
            </Text>
            <Link
              href="https://zkignite.minaprotocol.com/zkignite/dev4dev/refineproposals/suggestion/567/detail"
              target="_blank"
            >
              <Flex direction={"row"} gap={1}>
                <Text>Read More</Text>
                <CgArrowTopRight />
              </Flex>
            </Link>
          </Flex>
          <Spacer />
          <Flex
            direction={"row"}
            p={10}
            gap={10}
            fontFamily={"Source Code Pro Variable"}
          >
            {" "}
            <Flex direction={"column"}>
              <Heading
                size={"md"}
                mb={5}
                fontFamily={"Montserrat Variable"}
                color={"purple.300"}
              >
                Learn
              </Heading>
              <Flex direction={"column"} gap={2} color={"purple.100 "}>
                <Link href="docs">Docs</Link>
                <Link href="github">Github</Link>
                <Link href="proposal">Proposal</Link>
              </Flex>
            </Flex>{" "}
            <Flex direction={"column"}>
              <Heading
                size={"md"}
                mb={5}
                fontFamily={"Montserrat Variable"}
                color={"purple.300"}
              >
                Links
              </Heading>
              <Flex direction={"column"} gap={2} color={"purple.100 "}>
                <Link href="/home">Home</Link>
                <Link href="/feeds">Feeds</Link>
                <Link href="/dashboard">Dashboard</Link>
              </Flex>
            </Flex>
            <Flex direction={"column"} mr={20}>
              <Heading
                size={"md"}
                mb={5}
                fontFamily={"Montserrat Variable"}
                color={"purple.300"}
              >
                Contact
              </Heading>
              <Flex direction={"column"} gap={2} color={"purple.100 "}>
                <Link href="ttwttier">Twitter</Link>
                <Link href="email">Email</Link>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
{
}
