import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>No</title>
      </Head>
      <div class="max-w-screen-sm text-center mx-auto font-mono">
        <span>door is the other way</span>
      </div>
    </>
  );
}
