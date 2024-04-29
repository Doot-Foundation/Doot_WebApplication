import React from "react";
import { ResponsiveLine } from "@nivo/line";

export default function GradientLineChart() {
  const data = [
    {
      color: "hsl(348, 70%, 50%)",
      data: [
        {
          color: "hsl(332, 70%, 50%)",
          x: "MN",
          y: 11,
        },
        // ... other data points
      ],
      id: "whisky",
    },
  ];

  const defs = [
    {
      colors: [
        {
          color: "inherit",
          offset: 0,
        },
        {
          color: "inherit",
          offset: 100,
          opacity: 0,
        },
      ],
      id: "gradientA",
      type: "linearGradient",
    },
  ];

  return (
    <ResponsiveLine
      animate
      curve="monotoneX"
      data={data}
      defs={defs}
      enableArea
      enableSlices="x"
      enableTouchCrosshair
      fill={[
        {
          id: "gradientA",
          match: "*",
        },
      ]}
      height={400}
      margin={{
        bottom: 60,
        left: 80,
        right: 20,
        top: 20,
      }}
      width={900}
      yScale={{
        stacked: true,
        type: "linear",
      }}
    />
  );
}
