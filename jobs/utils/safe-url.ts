import { ResultAsync } from "neverthrow";

export function checkUrlsSafety(url: string) {
  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${
    Deno.env.get("GOOGLE_SAFE_BROWSING_API_KEY")
  }`;

  const payload = {
    client: {
      clientId: "game-news.dev",
      clientVersion: "1.0.0",
    },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  return ResultAsync.fromPromise(
    (async () => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.matches) {
        // deno-lint-ignore no-explicit-any
        data.matches.forEach((match: any) => {
          if (match && match.threat && match.threatType) {
            console.info(`URL: ${match.threat.url} is unsafe. Threat type: ${match.threatType}`);
          } else {
            console.error("Found a threat match but couldn't parse its details", match);
          }
        });
        return { isSafe: false, threats: data.matches };
      } else {
        return { isSafe: true };
      }
    })(),
    (error) => {
      console.error("Error checking URLs:", error);
      return { err: error, message: "Error while checking URL safety" };
    },
  );
}
