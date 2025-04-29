import { IS_BROWSER } from "$fresh/runtime.ts";

export default function DeleteForm({ error }: { error?: string }) {
  const onDeleteClick = (e: Event) => {
    e.preventDefault();
    if (!IS_BROWSER) return;
    if (!globalThis.confirm("Are you sure?")) return;
    const form = e.target as HTMLFormElement;
    form.submit();
  };

  return (
    <form onSubmit={onDeleteClick} method="post" id="delete-form" className="text-center">
      <button
        type="submit"
        form="delete-form"
        className="text-red-500 underline-offset-4 underline italic"
      >
        Delete Account
      </button>

      {error && <div className="mt-4 text-sm text-red-500">{error}</div>}
    </form>
  );
}
