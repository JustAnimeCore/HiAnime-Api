import axios from "axios";
import * as cheerio from "cheerio";
import formatTitle from "../helper/formatTitle.helper.js";
import { v1_base_url } from "../utils/base_v1.js";
import { axiosConfig } from "../utils/httpAgent.js";

async function extractSeasons(id) {
  try {
    const resp = await axios.get(`https://${v1_base_url}/watch/${id}`, axiosConfig);
    const $ = cheerio.load(resp.data);
    const seasons = $(".anis-watch>.other-season>.inner>.os-list>a")
      .map((index, element) => {
        const href = $(element).attr("href");
        const data_number = index;
        const data_id = parseInt(href.split("-").pop());
        const season = $(element).find(".title").text().trim();
        const title = $(element).attr("title").trim() || "";
        const id = href.replace(/^\/+/, "");
        const style = $(element).find(".season-poster").attr("style") || "";
        const posterMatch = style.match(/url\((.*?)\)/);
        const season_poster = posterMatch ? posterMatch[1] : "";

        return { id, data_number, data_id, season, title, season_poster };
      })
      .get();
    return seasons;
  } catch (e) {
    console.log(e);
  }
}

export default extractSeasons;
