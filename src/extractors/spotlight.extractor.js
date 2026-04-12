import axios from "axios";
import * as cheerio from "cheerio";
import { v1_base_url } from "../utils/base_v1.js";
import { axiosConfig } from "../utils/httpAgent.js";

async function extractSpotlights() {
  try {
    const resp = await axios.get(`https://${v1_base_url}/home`, axiosConfig);
    const $ = cheerio.load(resp.data);

    // Select featured swiper slides
    const slideElements = $(".swiper.featured .swiper-slide");

    const promises = slideElements
      .map(async (ind, ele) => {
        const $ele = $(ele);
        
        // Get title and Japanese title
        const titleEl = $ele.find(".detail .title");
        const title = titleEl.text().trim();
        const japanese_title = titleEl.attr("data-jp") || "";
        
        // Get description
        const description = $ele.find(".detail .desc").text().trim();
        
        // Get watch URL and extract id
        const watchHref = $ele.find(".detail .watch-btn").attr("href") || "";
        const id = watchHref.replace("/watch/", "");
        
        // Get poster from background image
        const bgImage = $ele.attr("style") || "";
        const posterMatch = bgImage.match(/background-image:\s*url\(([^)]+)\)/);
        const poster = posterMatch ? posterMatch[1].replace(/['"]/g, "") : "";
        
        // Get info (type, genres)
        const infoSpans = $ele.find(".detail .info span");
        const genres = [];
        let showType = "";
        
        infoSpans.each((i, span) => {
          const $span = $(span);
          if ($span.find("b").length) {
            showType = $span.find("b").text().trim();
          } else if (!($span.hasClass("sub") || $span.hasClass("dub"))) {
            genres.push($span.text().trim());
          }
        });
        
        // Get mics info (rating, release, quality)
        const mics = {};
        $ele.find(".detail .mics > div").each((i, mic) => {
          const label = $(mic).find("div").text().trim();
          const value = $(mic).find("span").text().trim();
          mics[label] = value;
        });
        
        // Get sub/dub count from info
        const subCount = $ele.find(".detail .info .sub").text().replace(/[^0-9]/g, "") || "0";
        const dubCount = $ele.find(".detail .info .dub").text().replace(/[^0-9]/g, "") || "0";
        
        // Get data_id from the URL (last segment after last hyphen is usually the ID)
        const dataIdMatch = id.match(/-([a-z0-9]+)$/i);
        const data_id = dataIdMatch ? dataIdMatch[1] : id;
        
        return {
          id,
          data_id,
          poster,
          title,
          japanese_title,
          description,
          tvInfo: {
            showType,
            releaseDate: mics["Release"] || "",
            quality: mics["Quality"] || "HD",
            episodeInfo: {
              sub: subCount,
              dub: dubCount,
            },
          },
        };
      })
      .get();

    const serverData = await Promise.all(promises);
    return JSON.parse(JSON.stringify(serverData, null, 2));
  } catch (error) {
    console.error("Error fetching spotlights:", error.message);
    return error;
  }
}

export default extractSpotlights;