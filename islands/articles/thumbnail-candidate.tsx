import { useState } from "preact/hooks";
import { getImageFromCdn } from "~/jobs/utils/image-view.ts";

interface ThumbnailCandidateProps {
  imageUrl: string;
  imageSource: string;
  articleId: number;
  entityName: string;
  index: number;
}

export default function ThumbnailCandidate(props: ThumbnailCandidateProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectThumbnail = async () => {
    try {
      setError(null);
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("articleId", props.articleId.toString());
      formData.append("url", props.imageUrl);
      formData.append("source", props.imageSource);

      const response = await fetch("/api/articles/thumbnail", {
        method: "PUT",
        headers: {
          "X-API-KEY": "lovelyintaek",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to set thumbnail");
      }

      setIsSelected(true);
      setIsModalOpen(false); // Close the modal after successful selection
    } catch (error) {
      console.error("Error setting thumbnail:", error);
      setError("Failed to set thumbnail");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Thumbnail preview */}
      <div className="relative">
        <div
          onClick={() => setIsModalOpen(true)}
          className={`h-24 w-24 cursor-pointer transition-all ${
            isSelected ? "ring-2 ring-green-500" : "hover:opacity-90"
          }`}
        >
          <img
            src={getImageFromCdn(props.imageUrl)}
            alt={`${props.entityName} image ${props.index + 1}`}
            className="h-24 w-24 object-cover rounded"
          />
          {isSelected && (
            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs p-1 rounded-bl">
              ✓
            </div>
          )}
        </div>
        {error && (
          <div className="absolute -bottom-5 left-0 right-0 text-xs text-red-500 text-center">
            {error}
          </div>
        )}
      </div>

      {/* Modal for larger image view and selection */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium">Image Preview</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex flex-col items-center">
              <img
                src={getImageFromCdn(props.imageUrl)}
                alt={`${props.entityName} full preview`}
                className="max-h-[60vh] max-w-full object-contain mb-4"
              />

              <div className="text-sm text-gray-600 mb-4 text-center">
                <p>
                  Entity: <span className="font-medium">{props.entityName}</span>
                </p>
                <p className="mt-1 break-all">URL: {props.imageUrl}</p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleSelectThumbnail}
                  disabled={isSubmitting || isSelected}
                  className={`px-4 py-2 rounded ${
                    isSelected
                      ? "bg-green-100 text-green-800 cursor-default"
                      : isSubmitting
                      ? "bg-gray-100 text-gray-500 cursor-wait"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {isSelected ? "✓ Selected as Thumbnail" : isSubmitting ? "Setting..." : "Use as Article Thumbnail"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
