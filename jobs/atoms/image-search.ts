import { OpenVerseToken } from "~/types/openVerse.ts";
import type { OpenVerseImages } from "~/types/openVerse.ts";
import { GoogleImageSearchResponse } from "~/types/google.ts";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_SEARCH_API_KEY") ?? "";
const GOOGLE_SEARCH_ENGINE_ID = Deno.env.get("GOOGLE_SEARCH_ENGINE_ID") ?? "";
const GOOGLE_SEARCH_ENDPOINT = Deno.env.get("GOOGLE_SEARCH_ENDPOINT") ?? "";

if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID || !GOOGLE_SEARCH_ENDPOINT) {
  throw new Error(
    "Missing required environment variables for Google Search API",
  );
}

const OPENVERSE_API_KEY = Deno.env.get("OPENVERSE_API_KEY") ?? "";
const OPENVERSE_CLIENT_ID = Deno.env.get("OPENVERSE_CLIENT_ID") ?? "";
const OPENVERSE_ENDPOINT = Deno.env.get("OPENVERSE_ENDPOINT") ?? "";

if (!OPENVERSE_API_KEY || !OPENVERSE_CLIENT_ID || !OPENVERSE_ENDPOINT) {
  throw new Error(
    "Missing required environment variables for Openverse API",
  );
}

export class ImageSearchAtom {
  static async SearchGoogleImages(query: string) {
    const urlParams = new URLSearchParams();
    urlParams.append("q", query);
    urlParams.append("searchType", "image");
    urlParams.append("key", GOOGLE_API_KEY);
    urlParams.append("cx", GOOGLE_SEARCH_ENGINE_ID);
    urlParams.append("imgSize", "xlarge");
    urlParams.append("num", "6");
    urlParams.append(
      "rights",
      "cc_publicdomain,cc_attribute,cc_sharealike,cc_nonderived",
    );
    const response = await fetch(
      `${GOOGLE_SEARCH_ENDPOINT}?${urlParams}`,
      {
        method: "GET",
      },
    );
    const json = await response.json() as GoogleImageSearchResponse;

    return json;
  }

  static async SearchOpenverseImages(query: string) {
    const token = await this.GetOpenVerseToken();

    const params = new URLSearchParams();
    params.append("q", query);
    // params.append("size", "large,medium");
    // params.append("license", "by,by-nc,by-nc-nd,by-nc-sa,by-nd,by-sa,cc0");
    // params.append("license_type", "all");

    const images = await fetch(
      `${OPENVERSE_ENDPOINT}/images?${params}/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      },
    );
    const json = await images.json() as OpenVerseImages;
    return json;
  }

  static async GetOpenVerseToken() {
    const token = await fetch(
      `${OPENVERSE_ENDPOINT}/auth_tokens/token/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: OPENVERSE_CLIENT_ID,
          client_secret: OPENVERSE_API_KEY,
          grant_type: "client_credentials",
        }),
      },
    );
    const json = await token.json() as OpenVerseToken;
    return json;
  }
}
