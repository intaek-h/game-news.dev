import { FreshContext } from "$fresh/server.ts";
import { NavBar } from "~/components/nav-bar.tsx";
import { auth } from "~/auth.ts";
import { determineBestLanguage, setLanguageCookie } from "~/utils/language.ts";
import { LanguageAtom } from "~/jobs/atoms/language.ts";

export default async function Layout(req: Request, ctx: FreshContext) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  // Get all available languages with their names
  const { data: availableLanguagesData } = await LanguageAtom.GetAllLanguages();
  const availableLanguages = availableLanguagesData || [];
  const availableLanguageCodes = availableLanguages.map((lang) => lang.code);

  // Check if we're already on a language route
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const currentPath = pathParts[0];

  const isLanguagePath = availableLanguageCodes.includes(currentPath);

  // If we're not on a language route, determine the best language and redirect
  if (!isLanguagePath) {
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

    // Redirect to the preferred language route
    const redirectUrl = `/${preferredLanguage}${
      url.pathname === "/" ? "" : url.pathname
    }${url.search}`;
    return new Response(null, {
      status: 302,
      headers: {
        "Location": redirectUrl,
        "Set-Cookie": setLanguageCookie(preferredLanguage),
      },
    });
  }

  // Get the current language code from the URL path
  const currentLanguage = currentPath;

  return (
    <div class="pt-10">
      <NavBar
        user={session?.user}
        currentLanguage={currentLanguage}
        availableLanguages={availableLanguages}
      />
      <ctx.Component />
    </div>
  );
}
