import { ComposedChart, Area, XAxis, YAxis } from "recharts";
import { Flex } from "@chakra-ui/react";

export default function MiniChartDescriptionBox({
  direction,
  data,
  graphMax,
  graphMin,
}) {
  return (
    <>
      <Flex ml="-10">
        <ComposedChart
          width={200}
          height={50}
          data={data}
          cursor="pointer"
          position="absolute"
        >
          <defs>
            <linearGradient id="gradientgreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor="white" stopOpacity={0.2} />
              <stop offset="90%" stopColor="white" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientred" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor="white" stopOpacity={0.2} />
              <stop offset="90%" stopColor="white" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis
            dataKey="price"
            axisLine={false}
            tick={false}
            domain={[graphMin, graphMax]} // Set the absolute limits
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={direction == "+" ? "#14C67A" : "#ff0000"}
            strokeWidth={2}
            fillOpacity={0}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </Flex>
    </>
  );
}
