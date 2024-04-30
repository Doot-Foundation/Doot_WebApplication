import { ComposedChart, Area, XAxis, YAxis } from "recharts";
import { Text, Flex } from "@chakra-ui/react";
export default function NegativeMiniChart({
  data,
  graphMax,
  graphMin,
  percentage,
}) {
  return (
    <>
      <Flex position="relative">
        <Text color="red.400" position="absolute">
          {percentage}
        </Text>
        <ComposedChart width={300} height={120} data={data} p={0}>
          <defs>
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
            stroke="red"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#gradientred)"
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </Flex>
    </>
  );
}
