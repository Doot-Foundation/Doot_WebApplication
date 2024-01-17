import getMinaDetails from "../../../utils/helper/GetMinaInfo.ts";

export default async function handler(req, res) {
  const data = await getMinaDetails();
  res.status(200).json({ data: data });
}
