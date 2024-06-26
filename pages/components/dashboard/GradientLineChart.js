import { ComposedChart, Area, XAxis, YAxis, Tooltip } from "recharts";

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

      for (let i = 0; i <= currentMonth; i++) {
        const month = months[i];
        // if (json[month]) {
        result.push({ month, count: json[month] });
        // }
      }
      return result;
    }
    return [];
  }

  console.log(calls);
  const data = transformJsonToArray(calls);

  return (
    <>
      <ComposedChart
        width={940}
        height={300}
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
          // tickFormatter={(value) => (value === 0 ? "" : Math.round(value))}
          tickFormatter={(value) => Math.round(value)}
          dataKey="count"
          tick={{ fontWeight: "500", dx: -10 }}
          tickLine={false}
          axisLine={false}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#6B1BFF"
          fillOpacity={1}
          fill="url(#gradient)"
          activeDot={{ r: 10 }}
        />
      </ComposedChart>
    </>
  );
}
