import {
  Link,
  Flex,
  Image,
  Spacer,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  VStack,
  Box,
  Divider,
} from "@chakra-ui/react";
import { HiMenu } from "react-icons/hi";
import { FiTrendingUp, FiCheckCircle, FiGrid, FiBook } from "react-icons/fi";
import ConnectButton from "./ConnectButton";
import { useRouter } from "next/router";

export default function Header() {
  // const [isLargerThanMd] = useMediaQuery("(min-width: 1280px)");
  // if (!isLargerThanMd) return;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const isActive = (href) => router.pathname === href || router.pathname.startsWith(href + '/');

  return (
    <>
      <Flex
        maxW="1120px"
        w="100%"
        h="52px"
        m="0 auto"
        px={{ base: 4, md: 6 }}
        mt={{ base: 4, md: 10 }}
        mb={{ base: 6, md: 16 }}
        align="center"
        justify="center"
        gap={{ base: 3, md: 0 }}
      >
        {/* Mobile menu trigger */}
        <IconButton
          aria-label="Open menu"
          icon={<HiMenu />}
          display={{ base: "inline-flex", md: "none" }}
          onClick={onOpen}
          variant="ghost"
          colorScheme="whiteAlpha"
          mr={2}
        />

        <Link href="/">
          <Image src="/static/images/DootWhite.png" alt="Doot" h={{ base: 6, md: 7 }} w="auto" />
        </Link>
        <Spacer />
        {/* Desktop nav */}
        <Flex
          display={{ base: "none", md: "flex" }}
          direction="row"
          gap={{ md: 6, lg: 10 }}
          fontWeight="500"
          fontSize={{ md: "16px", lg: "18px" }}
          color="#BFBFBF"
        >
          <Link
            href="https://docs.doot.foundation/"
            target="_blank"
            _hover={{ textDecoration: "none", color: "white" }}
          >
            Docs
          </Link>
          <Link href="/feeds" _hover={{ color: "white", textDecoration: "none" }} color={isActive('/feeds') ? 'white' : undefined}>
            Feeds
          </Link>
          <Link href="/verify" _hover={{ color: "white", textDecoration: "none" }} color={isActive('/verify') ? 'white' : undefined}>
            Verify
          </Link>
          <Link href="/dashboard" _hover={{ color: "white", textDecoration: "none" }} color={isActive('/dashboard') ? 'white' : undefined}>
            Dashboard
          </Link>
        </Flex>
        <Spacer />
        {/* Hide connect on mobile header; show in drawer */}
        <Box display={{ base: "none", md: "block" }}>
          <ConnectButton />
        </Box>
      </Flex>

      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="#171717" color="white">
          <DrawerHeader>
            <Flex align="center" gap={3}>
              <Image src="/static/images/DootWhite.png" alt="Doot" h={6} w="auto" />
              <Box fontWeight={700}>Doot</Box>
              <Spacer />
              <DrawerCloseButton position="static" />
            </Flex>
          </DrawerHeader>
          <Divider borderColor="#2a2a2a" />
          <DrawerBody>
            <VStack align="flex-start" spacing={2}>
              <Box fontSize="sm" color="#9a9a9a" px={2} pb={1} textTransform="uppercase" letterSpacing="0.08em">
                Navigation
              </Box>
              <Link href="/feeds" onClick={onClose} w="100%">
                <Flex align="center" gap={3} px={2} py={2} borderLeft={isActive('/feeds') ? '3px solid #6B1BFF' : '3px solid transparent'} _hover={{ bg: '#1f1f1f' }}>
                  <FiTrendingUp />
                  <Box as="span" color={isActive('/feeds') ? '#FFFFFF' : '#BFBFBF'}>Feeds</Box>
                </Flex>
              </Link>
              <Link href="/verify" onClick={onClose} w="100%">
                <Flex align="center" gap={3} px={2} py={2} borderLeft={isActive('/verify') ? '3px solid #6B1BFF' : '3px solid transparent'} _hover={{ bg: '#1f1f1f' }}>
                  <FiCheckCircle />
                  <Box as="span" color={isActive('/verify') ? '#FFFFFF' : '#BFBFBF'}>Verify</Box>
                </Flex>
              </Link>
              <Link href="/dashboard" onClick={onClose} w="100%">
                <Flex align="center" gap={3} px={2} py={2} borderLeft={isActive('/dashboard') ? '3px solid #6B1BFF' : '3px solid transparent'} _hover={{ bg: '#1f1f1f' }}>
                  <FiGrid />
                  <Box as="span" color={isActive('/dashboard') ? '#FFFFFF' : '#BFBFBF'}>Dashboard</Box>
                </Flex>
              </Link>
              <Divider borderColor="#2a2a2a" />
              <Link href="https://docs.doot.foundation/" target="_blank" onClick={onClose} w="100%">
                <Flex align="center" gap={3} px={2} py={2} _hover={{ bg: '#1f1f1f' }}>
                  <FiBook />
                  <Box as="span">Docs</Box>
                </Flex>
              </Link>
              <Box pt={4} w="100%">
                <ConnectButton />
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
