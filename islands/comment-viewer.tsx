import { Time } from "~/jobs/time/index.ts";
import { useSignal } from "@preact/signals";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface Comment {
  id: number;
  content: string;
  userId: string;
  username: string;
  createdAt: Date;
  parentId: number | null;
  hasUpvoted: boolean;
}

interface CommentViewerProps {
  comment: Comment;
  depth: number;
  newsId: number;
}

export default function CommentViewer({ comment, depth, newsId }: CommentViewerProps) {
  const isReplying = useSignal(false);
  const hasUpvoted = useSignal(comment.hasUpvoted);
  const isLoading = useSignal(false);

  const handleReply = () => {
    isReplying.value = !isReplying.value;
  };

  const handleUpvote = async () => {
    if (!IS_BROWSER) return;
    if (isLoading.value) return;

    isLoading.value = true;
    try {
      if (hasUpvoted.value) {
        // Remove upvote
        const response = await fetch(`/api/comments/${comment.id}/upvote`, {
          method: "DELETE",
        });
        if (response.ok) {
          hasUpvoted.value = false;
        }
      } else {
        // Add upvote
        const response = await fetch(`/api/comments/${comment.id}/upvote`, {
          method: "POST",
        });
        if (response.ok) {
          hasUpvoted.value = true;
        }
      }
    } catch (error) {
      console.error("Error handling upvote:", error);
    } finally {
      isLoading.value = false;
    }
  };

  return (
    <div style={{ paddingLeft: `${depth * 1}rem` }}>
      <div className="mb-4">
        <div className="text-xs text-gray-500">
          <span>{comment.username}</span>
          <span className="mx-1">|</span>
          <span>{Time.Ago(comment.createdAt)}</span>
          <span className="mx-1">|</span>
          <button
            type="button"
            onClick={handleUpvote}
            disabled={isLoading.value}
            className={`hover:underline underline-offset-4 disabled:opacity-50 text-gray-400 disabled:cursor-progress ${
              hasUpvoted.value ? "text-blue-600" : ""
            }`}
          >
            {hasUpvoted.value ? "downvote" : "upvote"}
          </button>
          <span className="mx-1">|</span>
          <button type="button" onClick={handleReply} className="hover:underline underline-offset-4">
            {isReplying.value ? "cancel" : "reply"}
          </button>
        </div>
        <div className="mt-1 text-sm text-gray-900">
          {comment.content}
        </div>
        {isReplying.value && (
          <form action={`/api/news/${newsId}/comments`} method="post" className="mt-2">
            <input type="hidden" name="parentId" value={comment.id} />
            <textarea
              name="text"
              wrap="virtual"
              rows={4}
              className="w-full p-2 border-none rounded-none font-mono text-gray-900 placeholder:text-gray-400 bg-[#f8f9f9] outline-[#bdbbbb]"
              placeholder="your reply"
            />
            <button
              type="submit"
              className="text-blue-600 underline-offset-4 underline"
            >
              submit reply
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
