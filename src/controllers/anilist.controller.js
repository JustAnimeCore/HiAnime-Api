import axios from "axios";
import { Agent as HttpsAgent } from "node:https";

const ANILIST_URL = "https://graphql.anilist.co";

export const proxyAniList = async (req, res) => {
  try {
    const { query, variables } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ success: false, message: "query is required" });
    }

    const httpsAgent = new HttpsAgent({ rejectUnauthorized: false });

    const response = await axios.post(
      ANILIST_URL,
      { query, variables: variables || {} },
      {
        httpsAgent,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; AnimeApp/1.0)",
        },
        timeout: 15000,
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("[AniList Proxy] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch from AniList",
    });
  }
};
