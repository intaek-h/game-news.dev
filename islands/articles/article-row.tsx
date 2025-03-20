import { useState } from "preact/hooks";
import ThumbnailCandidate from "~/islands/articles/thumbnail-candidate.tsx";

export default function ArticleRow(
  props: { title: string; articleId: number; entities: string[] },
) {
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  const handleEntityClick = async (entity: string) => {
    try {
      setIsLoading(true);
      setSelectedEntity(entity);

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

      const data = await response.json();
      setSearchResults(data.urls || []);
    } catch (error) {
      console.error("Error searching images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-md">
      <h1 className="text-lg font-medium">{props.title}</h1>
      <div className="flex gap-2 mt-1">
        {props.entities.map((entity) => (
          <button
            type="button"
            key={entity}
            className={`text-sm py-0.5 px-1 rounded-md ${
              selectedEntity === entity
                ? "bg-blue-200 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
            onClick={() => handleEntityClick(entity)}
          >
            {entity}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="mt-2 text-sm text-gray-500">
          Loading images for "{selectedEntity}"...
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="mt-3">
          <h3 className="text-sm font-medium mb-2">
            Image results for "{selectedEntity}":
          </h3>
          <div className="flex flex-wrap gap-2">
            {searchResults.map((url, index) => (
              <ThumbnailCandidate
                key={index}
                imageUrl={url}
                articleId={props.articleId}
                entityName={selectedEntity || ""}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
