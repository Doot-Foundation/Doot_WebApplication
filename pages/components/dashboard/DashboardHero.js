import { Flex } from "@chakra-ui/react";
import { useEffect, useState, useContext } from "react";

import { SignerContext, ChainContext } from "../../../lib/context/contexts";

import axios from "axios";

import MenuItem from "./MenuItem";
import Profile from "./Profile";
import Keys from "./Keys";

export default function DashboardHero() {
  const key = process.env.NEXT_PUBLIC_API_INTERFACE_KEY;
  const { signer } = useContext(SignerContext);

  const [page, setPage] = useState("profile");
  const [userStatus, setUserStatus] = useState(undefined);
  const [userDetails, setUserDetails] = useState(undefined);

  useEffect(() => {
    if (signer) checkUserStatus();
  }, [signer]);

  async function checkUserStatus() {
    const headers = {
      Authorization: "Bearer " + key,
    };
    try {
      const res = await axios.get(`/api/get/getUserStatus?address=${signer}`, {
        headers: headers,
      });
      setUserStatus(res.data.status);
    } catch (error) {
      console.log("Failed Fetching The Status.");
    }
  }

  if (userStatus == 1) {
    getUserDetails();
  }

  async function getUserDetails() {
    const timestamp = Date.now();
    const toVerifyMessage = `Sign this message to prove you have access to this wallet in order to sign in to doot.foundation/dashboard. This won't cost you any Mina. Timestamp:${timestamp}`;
    const signedObj = await window.mina?.signMessage({
      message: toVerifyMessage,
    });

    signedObj.timestamp = timestamp;
    const finalObj = JSON.stringify(signedObj);

    const headers = {
      Authorization: "Bearer " + key,
      Signed: finalObj,
    };

    await axios
      .get(
        `/api/get/getUserInformation?address=${signer}&timestamp=${timestamp}`,
        {
          headers: headers,
        }
      )
      .then((res) => {
        console.log(res.data);
        const data = JSON.parse(res.data);
        setUserDetails(data);
      });
  }

  if (userDetails) console.log(userDetails);

  return (
    <>
      <Flex h={"100vh"}>
        <Flex direction={"column"} h={"100%"} w={"15%"} bgColor={"purple"}>
          <MenuItem page={"profile"} setPage={setPage}>
            Profile
          </MenuItem>
          <MenuItem page={"api"} setPage={setPage}>
            API Keys
          </MenuItem>
        </Flex>
        <Flex direction={"column"}>
          {page == "profile" ? <Profile /> : <Keys />}
        </Flex>
      </Flex>
    </>
  );
}
