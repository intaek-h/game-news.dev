import { IS_BROWSER } from "$fresh/runtime.ts";
import { useSignal } from "@preact/signals";

interface Props {
  postId: number;
  initialVoteCount: number;
  hasVoted: boolean;
}

export default function UpvoteButton({ postId, initialVoteCount, hasVoted }: Props) {
  const voteCount = useSignal(initialVoteCount);
  const isVoted = useSignal(hasVoted);
  const isLoading = useSignal(false);

  const handleVote = async () => {
    if (!IS_BROWSER) return;
    if (isLoading.value) return;

    isLoading.value = true;
    try {
      if (isVoted.value) {
        const response = await fetch(`/api/news/${postId}/upvote`, {
          method: "DELETE",
        });
        if (response.ok) {
          voteCount.value -= 1;
          isVoted.value = false;
        }
      } else {
        const response = await fetch(`/api/news/${postId}/upvote`, {
          method: "POST",
        });
        if (response.ok) {
          voteCount.value += 1;
          isVoted.value = true;
        }
      }
    } catch (error) {
      console.error("Error processing vote:", error);
    } finally {
      isLoading.value = false;
    }
  };

  return (
    <button
      type="button"
      onClick={handleVote}
      disabled={isLoading.value}
      className={`hover:underline underline-offset-4 disabled:opacity-50 text-gray-500 disabled:cursor-progress`}
    >
      {isVoted.value ? "downvote" : "upvote"}({voteCount.value})
    </button>
  );
}
