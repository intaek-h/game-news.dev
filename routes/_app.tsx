import { FreshContext } from "$fresh/server.ts";
import * as path from "$std/path/mod.ts";
import { walk } from "$std/fs/walk.ts";
import { asset } from "$fresh/runtime.ts";

export default async function App(_req: Request, ctx: FreshContext) {
  const outDir = path.join(ctx.config.build.outDir, "static");
  const files = walk(outDir, {
    exts: ["css"],
    includeDirs: false,
    includeFiles: true,
  });

  let criticalCSS = ""; // technically it's every tailwind style. just because it's tiny after all.

  for await (const file of files) {
    criticalCSS = await Deno.readTextFile(file.path); // it's only one file
  }

  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com"></link>
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin="true"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          as="style"
          // @ts-expect-error: OK to ignore
          onLoad="this.onload=null;this.rel='stylesheet'"
        />

        <style type="text/css">
          {criticalCSS}
        </style>

        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta property="og:image" content="/og-image.png" />

        <title>Game Dev News</title>

        <link
          rel="preload"
          href={asset("/styles.css")}
          as="style"
          // @ts-expect-error: OK to ignore
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        <noscript>
          <link rel="stylesheet" href={asset("/styles.css")} />
        </noscript>
      </head>
      <body className="mx-auto max-w-4xl">
        <ctx.Component />
      </body>
    </html>
  );
}
