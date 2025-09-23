import { ComposedChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Flex } from "@chakra-ui/react";

export default function MiniChartDescriptionBox({
  direction,
  data,
  graphMax,
  graphMin,
}) {
  // Filter data to last 24 hours only (same as MiniChart)
  const filteredData = (() => {
    if (!data || !Array.isArray(data)) return [];

    const { filterDataByTimeWindow } = require("@/utils/helper/TimeWindowFilter");
    return filterDataByTimeWindow(data, '24h', 0);
  })();

  // Calculate min/max for the filtered 24h data
  const { min24h, max24h } = (() => {
    if (!filteredData || filteredData.length === 0) {
      return { min24h: graphMin, max24h: graphMax };
    }

    const prices = filteredData.map(item => Number(item.price)).filter(price => !isNaN(price));
    if (prices.length === 0) {
      return { min24h: graphMin, max24h: graphMax };
    }

    return {
      min24h: Math.min(...prices),
      max24h: Math.max(...prices)
    };
  })();

  return (
    <>
      <Flex ml="-10" w={{ base: '160px', md: '200px' }} h="50px">
        <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={filteredData} cursor="pointer">
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
            domain={[min24h, max24h]} // Set the 24h limits for better scaling
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
        </ResponsiveContainer>
      </Flex>
    </>
  );
}
