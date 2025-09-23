import { ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function GradientLineChart({ calls = {} }) {
  function transformJsonToArray(json) {
    if (json) {
      const currentMonth = new Date().getMonth();
      const months = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];
      let result = [];
      let maxCalls = -Infinity;

      for (let i = 0; i <= currentMonth; i++) {
        const month = months[i];
        if (json[month] > maxCalls) maxCalls = json[month];
        result.push({ month: month, Count: json[month] });
      }
      return [maxCalls, result];
    } else return [];
  }

  const [maxCalls, data] = transformJsonToArray(calls);

  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={data}
        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
      >
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d5bfff" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#d5bfff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{
            margin: "0",
            padding: "0 30px 25px 30px",
          }}
        />
        <XAxis
          dataKey="month"
          tick={{ fontWeight: "700", dy: 15 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          label={{ value: "Calls", angle: -90, position: "insideLeft" }}
          tickFormatter={(value) => (value == maxCalls ? value : "")}
          // tickFormatter={(value) => Math.round(value)}
          dataKey="Count"
          tick={{ fontWeight: "500", dx: -5, dy: -4 }}
          // tickLine={false}
          axisLine={false}
        />
        <Area
          type="monotone"
          dataKey="Count"
          stroke="#6B1BFF"
          fillOpacity={1}
          fill="url(#gradient)"
          activeDot={{ r: 10 }}
        />
      </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
