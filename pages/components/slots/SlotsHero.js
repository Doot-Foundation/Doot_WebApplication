import { Flex } from "@chakra-ui/react";
import IndividualSlot from "./IndividualSlot";
import { TOKEN_TO_CACHE } from "../../../utils/constants/info";

export default function SlotsHero() {
  const tokens = Object.keys(TOKEN_TO_CACHE);

  return (
    <>
      <Flex flexWrap={"wrap"}>
        {tokens.map((token, index) => {
          return <IndividualSlot key={index} token={token} />;
        })}
      </Flex>
    </>
  );
}
