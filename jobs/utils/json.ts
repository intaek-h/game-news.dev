import parser from "json-like-parse";

interface Options {
  maybeJson: string;
}

export function unstableJsonParser<T>({ maybeJson }: Options): T | undefined {
  try {
    const result = parser(maybeJson);
    return result as T;
  } catch (error) {
    console.error("Error parsing JSON-like string:", error);
    return undefined;
  }
}
