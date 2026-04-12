import axios from "axios";
import { v1_base_url } from "../utils/base_v1.js";
import { provider } from "../utils/provider.js";
import { axiosConfig } from "../utils/httpAgent.js";

export async function extractSubtitle(id) {
  const resp = await axios.get(
    `https://${v1_base_url}/ajax/v2/episode/sources/?id=${id}`,
    axiosConfig
  );
  const source = await axios.get(
    `${provider}/embed-2/ajax/e-1/getSources?id=${resp.data.link
      .split("/")
      .pop()
      .replace(/\?k=\d?/g, "")}`,
    axiosConfig
  );
  const subtitles = source.data.tracks;
  const intro = source.data.intro;
  const outro = source.data.outro;
  return { subtitles, intro, outro };
}
