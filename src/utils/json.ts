import parser from "json-like-parse";

export function unstableJsonParser<T>(p: { maybeJson: string }): T | undefined {
  try {
    const { maybeJson } = p;
    const objArr = parser(maybeJson);
    return objArr[0];
  } catch (error) {
    console.error("Error parsing JSON-like string:", error);
    return undefined;
  }
}
