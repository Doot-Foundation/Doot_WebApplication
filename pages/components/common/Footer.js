import {
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
        <Flex
          direction={{ base: "column", md: "row" }}
          m="0 auto"
          w={{ base: "100%", md: "1200px" }}
          px={{ base: 4, md: 0 }}
          justify="center"
          align={{ base: "center", md: "center" }}
          center={{ base: "center", md: "center" }}
          mb={{ base: 12, md: 100 }}
        >
          <Flex direction={"column"} gap={2} align={{ base: 'center', md: 'flex-start' }}>
            <Image
              src="/static/images/DootWhite.png"
              h="33px"
              w="108px"
              mb={5}
            />
            <Text mt={1} textAlign={{ base: 'center', md: 'left' }}>2023 - Present</Text>
            <Text textAlign={{ base: 'center', md: 'left' }}>zkIgnite Cohort 2 Funded Project</Text>
            <Link href="https://zkignite.minaprotocol.com/" target="_blank">
              <Flex direction={"row"} gap={1} align="center">
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
                <Image src="/static/images/Link_Twitter.png" alt="Twitter" />
              </Link>
              <Link
                href="https://github.com/Doot-Foundation"
                _hover={{}}
                target="_blank"
              >
                <Image src="/static/images/Link_GitHub.png" alt="GitHub" />
              </Link>
              <Link href="#" _hover={{}} target="_blank">
                <Image src="/static/images/Link_Discord.png" alt="Discord" />
              </Link>
              <Box onClick={sendEmail} cursor="pointer">
                <Image src="/static/images/Link_Mail.png" alt="Email" />
              </Box>
            </Flex>
          </Flex>
          <Spacer display={{ base: 'none', md: 'block' }} />
          <Flex
            direction={{ base: "row", md: "row" }}
            gap={{ base: 6, md: 10 }}
            mt={{ base: 10, md: 0 }}
            fontFamily={"Source Code Pro Variable"}
          >
            <Flex direction={"column"}>
              <Heading
                size={"md"}
                mb={5}
                fontFamily={"Montserrat Variable"}
                textAlign={{ base: 'center', md: 'right' }}
              >
                Learn
              </Heading>
              <Flex direction={"column"} gap={2} textAlign={{ base: 'center', md: 'right' }}>
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
                textAlign={{ base: 'center', md: 'right' }}
              >
                Links
              </Heading>
              <Flex direction={"column"} gap={2} textAlign={{ base: 'center', md: 'right' }}>
                <Link href="/">Home</Link>
                <Link href="/feeds">Feeds</Link>
                {/* <Link href="/slots">Slots</Link> */}
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
