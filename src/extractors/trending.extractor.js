import axios from "axios";
import * as cheerio from "cheerio";
import { v1_base_url } from "../utils/base_v1.js";
import { axiosConfig } from "../utils/httpAgent.js";

async function fetchAnimeDetails(element) {
  const $ele = $(element);
  
  // Get poster from style background or img
  let poster = "";
  const bgImage = $ele.find(".poster").attr("style") || $ele.find(".aitem").attr("style") || "";
  const posterMatch = bgImage.match(/url\(([^)]+)\)/);
  if (posterMatch) {
    poster = posterMatch[1].replace(/['"]/g, "");
  }
  if (!poster) {
    poster = $ele.find(".poster img").attr("src") || $ele.find("img").attr("data-src") || "";
  }
  
  // Get title and Japanese title
  const title = $ele.find(".title, .name").text().trim();
  const japanese_title = $ele.find(".title, .name").attr("data-jp") || "";
  
  // Get ID from href
  const href = $ele.find(".poster, .aitem").attr("href") || $ele.find("a").first().attr("href") || "";
  const id = href.replace("/watch/", "") || "";
  
  // Get number/ranking
  const number = $ele.find(".num").text().trim() || "";
  
  // Get data_id (last segment of id)
  const dataIdMatch = id.match(/-([a-z0-9]+)$/i);
  const data_id = dataIdMatch ? dataIdMatch[1] : id;
  
  return { id, data_id, number, poster, title, japanese_title };
}

async function extractTrending() {
  try {
    const resp = await axios.get(`https://${v1_base_url}/home`, axiosConfig);
    const $ = cheerio.load(resp.data);

    // Find top anime / trending section
    const trendingElements = $(".top-anime .aitem, .aitem-col.top-anime .aitem, #top-anime .aitem");
    
    const elementPromises = trendingElements
      .map((index, element) => {
        return fetchAnimeDetails($(element));
      })
      .get();

    const trendingData = await Promise.all(elementPromises);
    return JSON.parse(JSON.stringify(trendingData));
  } catch (error) {
    console.error("Error fetching trending data:", error.message);
    return error;
  }
}

export default extractTrending;