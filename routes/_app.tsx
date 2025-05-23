import { PageProps } from "$fresh/server.ts";
import { asset } from "$fresh/runtime.ts";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />

        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:image" content="/og-image.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />

        <title>Game News</title>

        <link
          rel="stylesheet"
          href={asset("/styles.css")}
          as="style"
        />
      </head>

      <body className="mx-auto max-w-4xl">
        <Component />
      </body>
    </html>
  );
}
