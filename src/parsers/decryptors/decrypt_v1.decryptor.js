import axios from "axios";
import CryptoJS from "crypto-js";
import * as cheerio from "cheerio";
import { v1_base_url } from "../../utils/base_v1.js";
import { v4_base_url } from "../../utils/base_v4.js";
import { fallback_1, fallback_2 } from "../../utils/fallback.js";

function fetch_key(data) {
  let key = null;

  const xyMatch = data.match(/window\._xy_ws\s*=\s*["']([^"']+)["']/);
  if (xyMatch) {
    key = xyMatch[1];
  }

  if (!key) {
    const lkMatch = data.match(/window\._lk_db\s*=\s*\{([^}]+)\}/);

    if (lkMatch) {
      key = [...lkMatch[1].matchAll(/:\s*["']([^"']+)["']/g)]
        .map((v) => v[1])
        .join("");
    }
  }

  if (!key) {
    const nonceMatch = data.match(/nonce\s*=\s*["']([^"']+)["']/);
    if (nonceMatch) {
      key = nonceMatch[1];
    }
  }

  if (!key) {
    const dpiMatch = data.match(/data-dpi\s*=\s*["']([^"']+)["']/);
    if (dpiMatch) {
      key = dpiMatch[1];
    }
  }

  if (!key) {
    const metaMatch = data.match(
      /<meta[^>]*name\s*=\s*["']_gg_fb["'][^>]*content\s*=\s*["']([^"']+)["']/i,
    );
    if (metaMatch) {
      key = metaMatch[1];
    }
  }

  if (!key) {
    const isThMatch = data.match(/_is_th\s*:\s*([A-Za-z0-9]+)/);
    if (isThMatch) {
      key = isThMatch[1];
    }
  }

  return key;
}

export async function decryptSources_v1(epID, id, name, type, fallback) {
  try {
    let decryptedSources = null;
    let iframeURL = null;
    let ajaxLink = null;

    if (fallback) {
      const fallback_server = ["hd-1", "hd-3"].includes(name.toLowerCase())
        ? fallback_1
        : fallback_2;

      iframeURL = `https://${fallback_server}/stream/s-2/${epID}/${type}`;

      const { data } = await axios.get(
        `https://${fallback_server}/stream/s-2/${epID}/${type}`,
        {
          headers: {
            Referer: `https://${fallback_server}/`,
          },
        },
      );

      const $ = cheerio.load(data);
      const dataId = $("#megaplay-player").attr("data-id");
      const { data: decryptedData } = await axios.get(
        `https://${fallback_server}/stream/getSources?id=${dataId}`,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );
      decryptedSources = decryptedData;
    } else {
      const { data: sourcesData } = await axios.get(
        `https://${v4_base_url}/ajax/episode/sources?id=${id}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          },
        },
      );

      ajaxLink = sourcesData?.link;
      if (!ajaxLink) throw new Error("Missing link in sourcesData");
      iframeURL = ajaxLink;

      const sourceIdMatch = /\/([^/?]+)\?/.exec(ajaxLink);
      const sourceId = sourceIdMatch?.[1];
      if (!sourceId) throw new Error("Unable to extract sourceId from link");

      const baseUrlMatch = ajaxLink.match(/^(https?:\/\/[^\/]+(?:\/[^\/]+){3})/);
      if (!baseUrlMatch) throw new Error("Could not extract base URL");
      const baseUrl = baseUrlMatch[1];

      const sourcesUrl = `${baseUrl}/getSources?id=${sourceId}`;

      const { data: directData } = await axios.get(sourcesUrl, {
        headers: {
          Accept: "*/*",
          "X-Requested-With": "XMLHttpRequest",
          Referer: `${ajaxLink}&autoPlay=1&oa=0&asi=1`,
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          Origin: baseUrl.match(/^https?:\/\/[^\/]+/)[0],
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
        },
      });

      decryptedSources = directData;
    }

    return {
      id,
      type,
      link: {
        file: fallback
          ? (decryptedSources?.sources?.file ?? "")
          : (Array.isArray(decryptedSources?.sources)
            ? (decryptedSources?.sources?.[0]?.file ?? "")
            : (typeof decryptedSources?.sources === "object" ? (decryptedSources?.sources?.file ?? "") : "")),
        type: "hls",
      },
      tracks: decryptedSources.tracks ?? [],
      intro: decryptedSources.intro ?? null,
      outro: decryptedSources.outro ?? null,
      iframe: iframeURL,
      server: name,
    };
  } catch (error) {
    console.error(
      `Error during decryptSources_v1(${id}, epID=${epID}, server=${name}):`,
      error.response ? `${error.response.status} - ${error.response.statusText}` : error.message,
    );
    return null;
  }
}
