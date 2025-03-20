import { useState } from "preact/hooks";
import ThumbnailCandidate from "~/islands/articles/thumbnail-candidate.tsx";

interface CitationImage {
  url: string;
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
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const fetchCitationImages = async () => {
    // Only fetch if not already fetched
    if (citationImages.length > 0 || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Set total for progress tracking
      const totalCitations = props.citations.length;
      setProgress({ current: 0, total: totalCitations });

      // Create an array of promises for parallel fetching
      const fetchPromises = props.citations.map(async (citation) => {
        try {
          const response = await fetch(
            `/api/scrape/article-extractor?link=${
              encodeURIComponent(citation)
            }`,
            {
              headers: {
                "X-API-KEY": "lovelyintaek",
              },
            },
          );

          // Update progress after each fetch completes
          setProgress((prev) => ({
            current: prev.current + 1,
            total: prev.total,
          }));

          if (!response.ok) {
            console.error(`Failed to extract from citation: ${citation}`);
            return null;
          }

          const data = await response.json();

          if (data.image) {
            return {
              url: data.image,
              source: citation,
            };
          }
          return null;
        } catch (err) {
          console.error(`Error processing citation ${citation}:`, err);
          return null;
        }
      });

      // Wait for all fetch operations to complete
      const results = await Promise.all(fetchPromises);

      // Filter out null results and update state
      const validResults = results.filter((item): item is CitationImage =>
        item !== null
      );
      setCitationImages(validResults);
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
            className="h-24 w-auto object-cover rounded border border-gray-200"
          />
        </div>
      )}

      {isExpanded && (
        <div className="mt-3">
          {isLoading && (
            <div className="py-4 text-center text-gray-500">
              <p>
                Loading images from citation links... ({progress
                  .current}/{progress.total})
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 max-w-md mx-auto">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{
                    width: `${
                      progress.total
                        ? (progress.current / progress.total) * 100
                        : 0
                    }%`,
                  }}
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
                    imageUrl={image.url}
                    articleId={props.articleId}
                    entityName={`Citation ${index + 1}`}
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
