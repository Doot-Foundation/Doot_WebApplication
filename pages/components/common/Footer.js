import {
  Button,
  Flex,
  Box,
  Image,
  Text,
  Heading,
  Link,
  Spacer,
} from "@chakra-ui/react";
import { CgArrowTopRight } from "react-icons/cg";

export default function Footer() {
  function sendEmail() {
    window.location.href = "mailto:contact@doot.foundation";
  }

  return (
    <>
      <Flex direction={"column"} gap={10} h={"fit-content"}>
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
        </Flex>
        <Flex
          direction={"row"}
          m="0 auto"
          w="1200px"
          justify="center"
          center="center"
          mb={100}
        >
          <Flex direction={"column"} gap={2}>
            <Image
              src="/static/images/DootWhite.png"
              h="33px"
              w="108px"
              mb={5}
            />
            <Text mt={1}>2023 - Present</Text>
            <Text>zkIgnite Cohort 2 Funded Project</Text>
            <Link href="https://zkignite.minaprotocol.com/" target="_blank">
              <Flex direction={"row"} gap={1}>
                <Text>Read more about zkIgnite</Text>
                <CgArrowTopRight />
              </Flex>
            </Link>
            <Flex gap={5} mt={5}>
              <Link
                href={"https://x.com/DootFoundation"}
                target="_blank"
                _hover={{}}
              >
                <Image src="/static/images/Link_Twitter.png" />
              </Link>
              <Link
                href="https://github.com/Doot-Foundation"
                _hover={{}}
                target="_blank"
              >
                <Image src="/static/images/Link_GitHub.png" />
              </Link>
              <Link href="#" _hover={{}} target="_blank">
                <Image src="/static/images/Link_Discord.png" />
              </Link>
              <Box onClick={sendEmail} cursor="pointer">
                <Image src="/static/images/Link_Mail.png" />
              </Box>
            </Flex>
          </Flex>
          <Spacer />
          <Flex
            direction={"row"}
            gap={10}
            fontFamily={"Source Code Pro Variable"}
          >
            <Flex direction={"column"}>
              <Heading
                size={"md"}
                mb={5}
                fontFamily={"Montserrat Variable"}
                textAlign="right"
              >
                Learn
              </Heading>
              <Flex direction={"column"} gap={2} textAlign="right">
                <Link href="https://docs.doot.foundation">Docs</Link>
                <Link href="https://github.com/Doot-Foundation">Github</Link>
                <Link href="https://zkignite.minaprotocol.com/zkignite/dev4dev/refineproposals/suggestion/567/detail">
                  Proposal
                </Link>
              </Flex>
            </Flex>
            <Flex direction={"column"}>
              <Heading
                size={"md"}
                mb={5}
                fontFamily={"Montserrat Variable"}
                textAlign="right"
              >
                Links
              </Heading>
              <Flex direction={"column"} gap={2} textAlign="right">
                <Link href="/">Home</Link>
                <Link href="/feeds">Feeds</Link>
                <Link href="/slots">Slots</Link>
                <Link href="/verify">Verify</Link>
                <Link href="/dashboard">Dashboard</Link>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
