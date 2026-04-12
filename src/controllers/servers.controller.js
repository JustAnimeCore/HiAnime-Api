import { extractServers } from "../extractors/streamInfo.extractor.js";

export const getServers = async (req) => {
  try {
    const { ep } = req.query;
    console.log("[Server] getServers called with ep:", ep);
    const servers = await extractServers(ep);
    console.log("[Server] extractServers returned:", servers);
    return servers;
  } catch (e) {
    console.error("[Server] getServers error:", e);
    return e;
  }
};
