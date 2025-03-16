import { type PageProps } from "$fresh/server.ts";
export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Game News</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body className="mx-auto max-w-4xl p-4">
        <Component />
      </body>
    </html>
  );
}
