import { Handlers } from "$fresh/server.ts";
import { ImageSearchAtom } from "~/jobs/atoms/image-search.ts";

export interface ImageSearchResponse {
  images: {
    imageUrl: string;
    source: string;
  }[];
  query: string;
}

export const handler: Handlers = {
  async GET(req) {
    try {
      // Get the URL and parse the query parameter
      const url = new URL(req.url);
      const query = url.searchParams.get("query");

      // Return an error if there's no query parameter
      if (!query) {
        return Response.json(
          { error: "Missing query parameter" },
          { status: 400 },
        );
      }

      // Use the ImageSearchAtom to search for images
      const searchResults = await ImageSearchAtom.SearchGoogleImages(query);

      // Extract the image URLs from the search results
      const result = searchResults.items?.map((item) => ({
        imageUrl: item.link,
        source: item.displayLink,
      })) || [];

      // Return the results
      return Response.json({
        images: result,
        query,
      });
    } catch (error) {
      console.error("Error searching for images:", error);
      return Response.json(
        { error: "Failed to search for images" },
        { status: 500 },
      );
    }
  },
};
