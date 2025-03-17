import { Handlers } from "$fresh/server.ts";
import { ImageSearchAtom } from "~/jobs/atoms/image-search.ts";

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
      console.log("searchResults", searchResults);

      // Extract the image URLs from the search results
      const urls = searchResults.items?.map((item) => item.link) || [];

      // Return the results
      return Response.json({
        urls,
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
