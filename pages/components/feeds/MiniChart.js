import { ComposedChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Flex } from "@chakra-ui/react";

export default function MiniChart({ direction, data, graphMax, graphMin }) {
  return (
    <>
      <Flex w={{ base: '200px', md: '260px', lg: '300px' }} h="120px">
        <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} p={0}>
          <defs>
            <linearGradient id="gradientgreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor="#14C67A" stopOpacity={0.2} />
              <stop offset="90%" stopColor="#14C67A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientred" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor="#ff0000" stopOpacity={0.2} />
              <stop offset="90%" stopColor="#ff0000" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="timestamp" tick={false} axisLine={false} />
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
            fillOpacity={1}
            fill={
              direction == "+" ? "url(#gradientgreen)" : "url(#gradientred)"
            }
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
        </ResponsiveContainer>
      </Flex>
    </>
  );
}
