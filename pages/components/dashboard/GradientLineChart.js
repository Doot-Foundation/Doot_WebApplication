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

    // Iterate through the months up to the current month
    for (let i = 0; i <= currentMonth; i++) {
      const month = months[i];
      if (json[month]) {
        result.push({ month, count: json[month] });
      }
    }
    return result;
  }

  // const data = transformJsonToArray(calls);

  // const dummyCalls = {
  //   JAN: 432,
  //   FEB: 967,
  //   MAR: 225,
  //   APR: 751,
  //   MAY: 834,
  //   JUN: 445,
  //   JUL: 220,
  //   AUG: 177,
  //   SEP: 934,
  //   OCT: 662,
  //   NOV: 491,
  //   DEC: 301,
  // };

  const data = transformJsonToArray(calls);

  // const dummyData = [
  //   { month: "Jan", count: 542 },
  //   { month: "Feb", count: 312 },
  //   { month: "Mar", count: 112 },
  //   { month: "Apr", count: 112 },
  //   { month: "May", count: 756 },
  //   { month: "June", count: 563 },
  //   { month: "July", count: 658 },
  //   { month: "Aug", count: 657 },
  //   { month: "Sept", count: 112 },
  //   { month: "Oct", count: 852 },
  //   { month: "Nov", count: 563 },
  //   { month: "Dec", count: 651 },
  // ];
  console.log(calls);

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
          tickFormatter={(value) => (value === 0 ? "" : value)}
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
