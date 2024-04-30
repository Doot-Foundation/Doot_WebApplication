import { ComposedChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export default function PriceGraph({ graphData, graphMin, graphMax }) {
  return (
    <>
      <ComposedChart width={1100} height={300} data={graphData}>
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6B1BFF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6B1BFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{
            fontSize: "14px",
            margin: "0",
            padding: "0 30px 20px 30px",
          }}
        />
        <XAxis dataKey="timestamp" tick={false} />
        <YAxis
          tick={{
            fontWeight: "600",
            fontSize: "12px", // Set the font size
          }}
          dataKey="price"
          tickLine={false}
          axisLine={false}
          domain={[graphMin, graphMax]} // Set the absolute limits
          tickFormatter={(value) => `$${value}`}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#6B1BFF"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#gradient)"
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </>
  );
}
