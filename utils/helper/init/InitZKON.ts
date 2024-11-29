// InitZKON.js
import { ZKON } from "zkon-sdk";

const ZKON_API_KEY = process.env.ZKON_API_KEY || "";
const ZKON_URL = process.env.ZKON_URL || "";

const zkonClient = new ZKON(ZKON_API_KEY, ZKON_URL);

export default zkonClient;
