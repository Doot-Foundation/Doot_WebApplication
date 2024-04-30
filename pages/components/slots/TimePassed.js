import { useState, useEffect } from "react";
import { Text } from "@chakra-ui/react";

export default function TimePassed({ timestamp }) {
  function convertSecondsToMMSS(sent) {
    if (sent < 0) return "00:00";
    let inMs = sent * 1000;

    let dateObj = new Date(inMs);

    let minutes = dateObj.getUTCMinutes();
    let seconds = dateObj.getUTCSeconds();

    let formattedTime =
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0");

    return formattedTime;
  }

  return (
    <>
      <Text fontSize="14px">
        <i>Time left:{convertSecondsToMMSS(timestamp)}</i>
      </Text>
    </>
  );
}
