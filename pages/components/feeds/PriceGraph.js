import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function calculateNiceRange(min, max) {
  const range = max - min;
  const roughStep = range / 5; // Aim for about 5-6 ticks

  // Find the order of magnitude
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalizedStep = roughStep / magnitude;

  // Round to a "nice" number
  let niceStep;
  if (normalizedStep <= 1) niceStep = 1;
  else if (normalizedStep <= 2) niceStep = 2;
  else if (normalizedStep <= 5) niceStep = 5;
  else niceStep = 10;

  const step = niceStep * magnitude;

  // Calculate nice min and max
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  // Generate tick values
  const ticks = [];
  for (let i = niceMin; i <= niceMax; i += step) {
    ticks.push(Math.round(i * 100) / 100); // Round to avoid floating point issues
  }

  return { niceMin, niceMax, ticks };
}

function formatPrice(value) {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + "K";
  } else if (value < 1) {
    // For small values, show up to 4 decimal places
    return value.toFixed(4);
  } else {
    return value.toFixed(2);
  }
}

function formatFullPrice(value) {
  // Always show meaningful decimals for small values
  if (value < 1) {
    return value.toFixed(4);
  } else if (value < 100) {
    return value.toFixed(3);
  } else {
    return value.toFixed(2);
  }
}

export default function PriceGraph({
  graphData,
  graphMin,
  graphMax,
  timeframe,
}) {
  // Debug logging
  console.log("PriceGraph props:", {
    graphData,
    graphMin,
    graphMax,
    timeframe,
  });

  if (!graphData || !Array.isArray(graphData) || graphData.length === 0) {
    return <div>No data available</div>;
  }

  const { niceMin, niceMax } = calculateNiceRange(graphMin, graphMax);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={graphData}
        margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
      >
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6B1BFF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6B1BFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="timestamp" tick={false} axisLine={false} />
        <YAxis
          tick={{
            fontWeight: "600",
            fontSize: "12px",
            fill: "#CCCCCC",
          }}
          tickLine={false}
          axisLine={false}
          domain={[niceMin, niceMax]}
          tickCount={6}
          tickFormatter={(value) => `$${formatPrice(value)}`}
          width={45}
        />
        <Tooltip
          contentStyle={{
            fontSize: "16px",
            padding: "10px 14px",
            backgroundColor: "#0A0A0A",
            border: "2px solid #7f2affff",
            borderRadius: "8px",
            boxShadow:
              "0 0 30px rgba(139, 59, 255, 0.8), 0 0 15px rgba(139, 59, 255, 0.6), 0 4px 20px rgba(0, 0, 0, 0.5)",
            color: "#FFFFFF",
            fontWeight: "700",
          }}
          itemStyle={{
            color: "#FFFFFF",
            fontWeight: "700",
            backgroundColor: "transparent",
          }}
          labelStyle={{
            color: "#FFFFFF",
          }}
          separator=""
          formatter={(value) => [`$ ${formatFullPrice(value)}`]}
          labelFormatter={() => ""}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#6B1BFF"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#priceGradient)"
          activeDot={{ r: 5, fill: "#6B1BFF", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
