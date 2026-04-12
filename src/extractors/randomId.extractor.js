import axios from "axios";
import { v1_base_url } from "../utils/base_v1.js";
import { DEFAULT_HEADERS } from "../configs/header.config.js";
import { httpsAgent } from "../utils/httpAgent.js";

const axiosInstance = axios.create({ 
  headers: DEFAULT_HEADERS,
  httpsAgent,
  timeout: 30000,
});

export default async function extractRandomId() {
  try {
    const resp = await axiosInstance.get(`https://${v1_base_url}/random`);
    const redirectedUrl = resp.request.res.responseUrl;
    const id = redirectedUrl.split("/").pop();
    return id;
  } catch (error) {
    console.error("Error extracting random anime info:", error);
  }
}
