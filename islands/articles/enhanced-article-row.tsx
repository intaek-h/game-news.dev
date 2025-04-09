import { useState } from "preact/hooks";
import ThumbnailCandidate from "~/islands/articles/thumbnail-candidate.tsx";
import { ImageSearchResponse } from "~/routes/api/image-search/index.ts";
import { getImageFromCdn } from "~/jobs/utils/image-view.ts";

interface CitationImage {
  imageUrl: string;
  source: string;
}

export default function EnhancedArticleRow(
  props: {
    title: string;
    articleId: number;
    entities: string[];
    citations: string[];
    currentThumbnail?: string;
  },
) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [citationImages, setCitationImages] = useState<CitationImage[]>([]);
  const [entitySearchResults, setEntitySearchResults] = useState<
    Map<string, { imageUrl: string; source: string }[]>
  >(new Map());
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [isEntitySearchLoading, setIsEntitySearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"citations" | "entities">(
    "citations",
  );

  const fetchCitationImages = async () => {
    // Only fetch if not already fetched
    if (citationImages.length > 0 || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use the API endpoint to fetch all citation images at once
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

  const handleEntityClick = async (entity: string) => {
    try {
      setIsEntitySearchLoading(true);
      setSelectedEntity(entity);
      setActiveTab("entities");

      // Skip API call if we already have results for this entity
      if (entitySearchResults.has(entity)) {
        return;
      }

      const response = await fetch(
        `/api/image-search?query=${encodeURIComponent(entity)}`,
        {
          headers: {
            "X-API-KEY": "lovelyintaek",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch image search results");
      }

      const data = await response.json() as ImageSearchResponse;
      // Update the Map with the new entity results
      setEntitySearchResults(
        new Map(entitySearchResults.set(entity, data.images || [])),
      );
    } catch (error) {
      console.error("Error searching images:", error);
    } finally {
      setIsEntitySearchLoading(false);
    }
  };

  const handleToggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    if (newExpanded) {
      fetchCitationImages();
    }
  };

  // Get the current entity results based on the selected entity
  const currentEntityResults = selectedEntity ? (entitySearchResults.get(selectedEntity) || []) : [];
  const hasCitationImages = citationImages.length > 0;
  const hasEntityResults = currentEntityResults.length > 0;

  return (
    <div className="p-4 border border-gray-200 rounded-md">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-medium">{props.title}</h1>
        <button
          type="button"
          onClick={handleToggleExpand}
          className="text-sm py-1 px-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          {isExpanded ? "Hide Thumbnail Options" : "Show Thumbnail Options"}
        </button>
      </div>

      {props.currentThumbnail && (
        <div className="mt-2">
          <p className="text-sm text-gray-500 mb-1">Current thumbnail:</p>
          <img
            src={getImageFromCdn(props.currentThumbnail)}
            alt="Current thumbnail"
            loading="lazy"
            className="h-24 w-auto object-cover rounded border border-gray-200"
          />
        </div>
      )}

      {isExpanded && (
        <div className="mt-3">
          <div className="mb-3">
            <h3 className="text-sm font-medium mb-2">Entities:</h3>
            <div className="flex flex-wrap gap-2 max-w-full">
              {props.entities.map((entity) => (
                <button
                  type="button"
                  key={entity}
                  className={`text-sm py-0.5 px-2 rounded-md ${
                    selectedEntity === entity ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-gray-800"
                  } truncate max-w-[150px]`}
                  onClick={() => handleEntityClick(entity)}
                  title={entity}
                >
                  {entity}
                </button>
              ))}
            </div>
          </div>

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

          {isEntitySearchLoading && activeTab === "entities" && (
            <div className="py-2 text-center text-gray-500">
              <p>Loading images for "{selectedEntity}"...</p>
            </div>
          )}

          {error && (
            <div className="py-2 text-center text-red-500">
              <p>{error}</p>
            </div>
          )}

          {/* Tab selector */}
          {(hasCitationImages || hasEntityResults) && (
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex">
                <button
                  type="button"
                  onClick={() => setActiveTab("citations")}
                  className={`py-2 px-4 text-sm font-medium border-b-2 ${
                    activeTab === "citations"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Citation Images {hasCitationImages ? `(${citationImages.length})` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("entities")}
                  className={`py-2 px-4 text-sm font-medium border-b-2 ${
                    activeTab === "entities"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  disabled={!selectedEntity}
                >
                  Entity Images {hasEntityResults ? `(${currentEntityResults.length})` : ""}
                </button>
              </nav>
            </div>
          )}

          {/* Citation images tab content */}
          {activeTab === "citations" && (
            <>
              {!isLoading && citationImages.length === 0 && !error && (
                <div className="py-2 text-center text-gray-500">
                  <p>
                    No images found in citation links. Try searching by entity instead.
                  </p>
                </div>
              )}

              {citationImages.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {citationImages.map((image, index) => (
                      <ThumbnailCandidate
                        key={`citation-${index}`}
                        imageUrl={image.imageUrl}
                        imageSource={image.source}
                        articleId={props.articleId}
                        entityName={image.source}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Entity search results tab content */}
          {activeTab === "entities" && selectedEntity && (
            <>
              {!isEntitySearchLoading && currentEntityResults.length === 0 && (
                <div className="py-2 text-center text-gray-500">
                  <p>No images found for "{selectedEntity}"</p>
                </div>
              )}

              {currentEntityResults.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentEntityResults.map((data, index) => (
                    <ThumbnailCandidate
                      key={`entity-${selectedEntity}-${index}`}
                      imageUrl={data.imageUrl}
                      imageSource={data.source}
                      articleId={props.articleId}
                      entityName={selectedEntity}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {!hasCitationImages && !hasEntityResults && !isLoading &&
            !isEntitySearchLoading && (
            <div className="text-sm text-gray-500 mt-2">
              <p>
                Start by clicking an entity to search for images, or wait for citation images to load.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
