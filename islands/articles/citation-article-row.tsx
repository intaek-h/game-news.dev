import { useState } from "preact/hooks";
import ThumbnailCandidate from "~/islands/articles/thumbnail-candidate.tsx";

interface CitationImage {
  imageUrl: string;
  source: string;
}

export default function CitationArticleRow(
  props: {
    title: string;
    articleId: number;
    citations: string[];
    currentThumbnail?: string;
  },
) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [citationImages, setCitationImages] = useState<CitationImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchCitationImages = async () => {
    // Only fetch if not already fetched
    if (citationImages.length > 0 || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use the new API endpoint capability to fetch all citation images at once
      const response = await fetch(
        `/api/scrape/article-extractor?articleId=${props.articleId}`,
        {
          headers: {
            "X-API-KEY": "lovelyintaek",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch citation images: ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (data.citationImages && Array.isArray(data.citationImages)) {
        setCitationImages(data.citationImages);
      } else {
        setCitationImages([]);
      }
    } catch (err) {
      console.error("Error fetching citation images:", err);
      setError("Failed to load images from citations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    if (newExpanded) {
      fetchCitationImages();
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-md">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-medium">{props.title}</h1>
        <button
          type="button"
          onClick={handleToggleExpand}
          className="text-sm py-1 px-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          {isExpanded ? "Hide Citation Images" : "Show Citation Images"}
        </button>
      </div>

      {props.currentThumbnail && (
        <div className="mt-2">
          <p className="text-sm text-gray-500 mb-1">Current thumbnail:</p>
          <img
            src={props.currentThumbnail}
            alt="Current thumbnail"
            loading="lazy"
            className="h-24 w-auto object-cover rounded border border-gray-200"
          />
        </div>
      )}

      {isExpanded && (
        <div className="mt-3">
          {isLoading && (
            <div className="py-4 text-center text-gray-500">
              <p>Loading images from citation links...</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 max-w-md mx-auto">
                <div
                  className="bg-blue-600 h-2.5 rounded-full animate-pulse"
                  style={{ width: "100%" }}
                >
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="py-2 text-center text-red-500">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && citationImages.length === 0 && !error && (
            <div className="py-2 text-center text-gray-500">
              <p>No images found in citation links</p>
            </div>
          )}

          {citationImages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Images from citations ({citationImages.length}):
              </h3>
              <div className="flex flex-wrap gap-2">
                {citationImages.map((image, index) => (
                  <ThumbnailCandidate
                    key={index}
                    imageUrl={image.imageUrl}
                    articleId={props.articleId}
                    entityName={image.source}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
