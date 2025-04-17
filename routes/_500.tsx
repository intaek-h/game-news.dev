import { Head } from "$fresh/runtime.ts";

export default function Error500Page() {
  return (
    <>
      <Head>
        <title>sorry</title>
      </Head>
      <div class="max-w-screen-sm text-center mx-auto font-mono">
        <span>sorry, something went wrong</span>
      </div>
    </>
  );
}
