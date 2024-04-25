import { Flex } from "@chakra-ui/react";

export default function HomeLayout({ children }) {
  return (
    <>
      <Flex direction="column" gap={8}>
        {children}
      </Flex>
    </>
  );
}
