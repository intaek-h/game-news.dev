import { useSignal } from "@preact/signals";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { useRef } from "preact/hooks";
import { debounce } from "lodash-es";

export default function CommentForm({ newsId }: { newsId: number }) {
  const isSubmitting = useSignal(false);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!IS_BROWSER) return;
    if (isSubmitting.value) return;

    isSubmitting.value = true;

    const debouncedSubmit = debounce(async () => {
      if (!formRef.current || !textareaRef.current) return;

      const text = textareaRef.current.value.trim();

      if (!text) return;

      try {
        const formData = new FormData();
        formData.append("text", text);

        const response = await fetch(`/api/news/${newsId}/comments`, {
          method: "POST",
          body: formData,
        });

        if (response.status === 429) {
          alert("You have reached the daily comment limit");
          return;
        }

        globalThis.location.href = response.url;
      } catch (error) {
        console.error("Error submitting comment:", error);
        alert("something went wrong please try again later.");
      } finally {
        isSubmitting.value = false;
      }
    }, 500);

    debouncedSubmit();
  };

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="flex" id="comment">
        <textarea
          ref={textareaRef}
          wrap="virtual"
          required
          rows={6}
          className="w-full p-2 border-2 rounded-lg font-mono text-gray-900 placeholder:text-gray-400 bg-[#f8f9f9] border-[#bdbbbb] outline-[#979494]"
          placeholder="your opinion"
        >
        </textarea>
      </form>
      <button
        type="submit"
        form="comment"
        disabled={isSubmitting.value}
        className="mt-1 text-medium text-blue-700 underline-offset-4 underline disabled:opacity-50 disabled:cursor-progress"
      >
        {isSubmitting.value ? "Submitting..." : "Submit"}
      </button>
    </>
  );
}
