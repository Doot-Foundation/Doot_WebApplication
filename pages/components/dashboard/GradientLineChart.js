import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip } from "recharts";

export default function GradientLineChart({ calls }) {
  function transformJsonToArray(json) {
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
      if (json[month]) {
        result.push({ month, count: json[month] });
      }
    }
    return result;
  }

  const data = transformJsonToArray(calls);

  return (
    <>
      <ComposedChart width={940} height={300} data={data}>
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d5bfff" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#d5bfff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip />
        <XAxis
          dataKey="month"
          tick={{ fontWeight: "500" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value) => (value === 0 ? "" : Math.round(value))}
          dataKey="count"
          tick={{ fontWeight: "500" }}
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
