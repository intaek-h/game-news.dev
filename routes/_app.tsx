import { type PageProps } from "$fresh/server.ts";
import { asset } from "$fresh/runtime.ts";

export default function App({ Component }: PageProps) {
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Game News</title>
      </head>
      <body className="mx-auto max-w-4xl">
        <Component />
      </body>
    </html>
  );
}
