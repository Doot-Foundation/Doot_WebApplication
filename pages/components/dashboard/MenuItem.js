import { Button } from "@chakra-ui/react";

export default function MenuItem({ children, page, setPage }) {
  return (
    <>
      <Button
        bgColor={"transparent"}
        color={"white"}
        _hover={{}}
        _active={{}}
        onClick={() => setPage(page)}
      >
        {children}
      </Button>
    </>
  );
}
