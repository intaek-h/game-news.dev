import { Handlers } from "$fresh/server.ts";
import { determineBestLanguage, setLanguageCookie } from "~/utils/language.ts";
import { auth } from "~/auth.ts";

// This route simply redirects to the appropriate language route
export const handler: Handlers = {
  async GET(req) {
    // Get the user session if available
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    // Determine the best language based on user preferences
    const preferredLanguage = await determineBestLanguage({
      user: session?.user
        ? {
          id: session.user.id,
          preferredLanguage: session.user.preferredLanguage,
        }
        : undefined,
      cookieHeader: req.headers.get("cookie") || undefined,
      acceptLanguageHeader: req.headers.get("accept-language") || undefined,
    });

    // Redirect to the preferred language
    return new Response(null, {
      status: 302,
      headers: {
        "Location": `/${preferredLanguage}`,
        "Set-Cookie": setLanguageCookie(preferredLanguage),
      },
    });
  },
};

// This is just a fallback that should never be rendered
export default function Home() {
  return (
    <div>
      <p>Redirecting to your preferred language...</p>
    </div>
  );
}
