import { extractStreamingInfo } from "../extractors/streamInfo.extractor.js";

export const getStreamInfo = async (req, res, fallback = false) => {
  try {
    const input = req.query.id;
    const server = req.query.server;
    const type = req.query.type;
    const ep = req.query.ep;

    let finalId = ep;
    if (!finalId && input) {
      const decoded = decodeURIComponent(input);
      finalId = decoded.match(/ep=(\d+)/)?.[1] || decoded;
    }

    if (!finalId) throw new Error("Invalid URL format: episode ID missing");

    console.log("[getStreamInfo] input:", input, "finalId:", finalId);
    const streamingInfo = await extractStreamingInfo(finalId, server, type, fallback);
    return streamingInfo;
  } catch (e) {
    console.error(e);
    return { error: e.message };
  }
};
