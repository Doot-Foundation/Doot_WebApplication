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
import { keyframes } from "@chakra-ui/react";

export default function HomeFooter() {
  function sendEmail() {
    window.location.href = "mailto:contact@doot.foundation";
  }

  const spin = keyframes`
  to { transform: rotate(360deg); }
 `;

  return (
    <>
      <Flex direction={"column"} gap={10} h={"fit-content"}>
        <Flex direction={"column"} align={"center"} gap={5} justify="center">
          <Heading fontFamily={"Montserrat Variable"} textAlign={"center"}>
            Begin your journey with
            <Box color="#6B1BFF" display="inline-block" ml={2} mr={2}>
              {" "}
              Doot{" "}
            </Box>
            today.
          </Heading>
          <Heading
            maxW="1200px"
            fontFamily={"Montserrat Variable"}
            fontSize="30px"
            textAlign="center"
          >
            Seemlessly integrate it with your next{" "}
            <b>
              <i>BIG THING&#9889; </i>
            </b>
            on the Mina Protocol and we'll be there to support you through every
            step.
          </Heading>
          <Flex
            mt={10}
            mb={20}
            w="224px"
            h="61px"
            position="relative"
            p="4px 2px"
            justify="center"
            align="center"
            borderRadius="100px"
            overflow="hidden"
          >
            <Box
              position="absolute"
              h={"600%"}
              w={"150%"}
              backgroundImage="linear-gradient(228.09deg, #5E5EE5 -9.95%, rgba(129, 129, 222, 0.8) 12.47%, rgba(94, 94, 229, 0.62) 30.87%, rgba(28, 25, 26, 0.89) 53.87%, rgba(68, 220, 183, 0.65) 70.34%, #00EAB1 100.44%)"
              animation={`${spin} 3s infinite linear`}
            />
            <Button
              borderRadius="100px"
              _hover={{}}
              _active={{}}
              bgColor="#171717"
              color="white"
              h="100%"
              w="100%"
              fontFamily={"Poppins"}
              onClick={sendEmail}
            >
              <Flex gap={1} justify="center" align="center">
                <Image src="/static/images/stars.png" />
                Contact Us
              </Flex>
            </Button>
          </Flex>
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
// href =
//   "https://zkignite.minaprotocol.com/zkignite/dev4dev/refineproposals/suggestion/567/detail";
