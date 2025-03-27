// filepath: /Users/ahiou/Documents/repositories/extinguish-backend/utils/language.ts
import { db } from "~/db/client.ts";
import { languages, user } from "~/db/migrations/schema.ts";
import { eq } from "drizzle-orm";

const LANG_COOKIE_NAME = "preferred_language";

export type UserWithLanguage = {
  id: string;
  preferredLanguage?: string;
};

/**
 * Updates a user's preferred language
 */
export async function updateUserLanguagePreference(
  userId: string,
  languageCode: string,
): Promise<boolean> {
  try {
    await db.update(user)
      .set({ preferredLanguage: languageCode })
      .where(eq(user.id, userId));
    return true;
  } catch (error) {
    console.error("Failed to update user language preference:", error);
    return false;
  }
}

/**
 * Gets available languages from the database
 */
export async function getAvailableLanguages(): Promise<string[]> {
  try {
    const result = await db.select({ code: languages.code })
      .from(languages)
      .where(eq(languages.isEnabled, true));

    return result.map((lang) => lang.code);
  } catch (error) {
    console.error("Failed to get available languages:", error);
    return ["en"]; // Default to English if query fails
  }
}

/**
 * Sets the language preference cookie
 */
export function setLanguageCookie(languageCode: string): string {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1); // Set cookie to expire in 1 year

  return `${LANG_COOKIE_NAME}=${languageCode}; Path=/; Expires=${expires.toUTCString()}; SameSite=Lax`;
}

/**
 * Gets language preference from cookie
 */
export function getLanguageFromCookie(
  cookieHeader?: string,
): string | undefined {
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${LANG_COOKIE_NAME}=`)) {
      return cookie.substring(LANG_COOKIE_NAME.length + 1);
    }
  }

  return undefined;
}

/**
 * Parses Accept-Language header and returns the best match from available languages
 */
export function parseAcceptLanguage(
  acceptLanguage: string,
  availableLanguages: string[],
): string | undefined {
  if (!acceptLanguage) return undefined;

  // Parse the Accept-Language header
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [languageCode, qualityValue] = lang.trim().split(";q=");
      return {
        code: languageCode.split("-")[0].toLowerCase(), // Take just the language part (e.g., 'en' from 'en-US')
        quality: qualityValue ? parseFloat(qualityValue) : 1.0,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find the first match in available languages
  for (const lang of languages) {
    if (availableLanguages.includes(lang.code)) {
      return lang.code;
    }
  }

  return undefined;
}

/**
 * Determines the best language based on the provided priorities
 */
export async function determineBestLanguage({
  user,
  cookieHeader,
  acceptLanguageHeader,
}: {
  user?: UserWithLanguage;
  cookieHeader?: string;
  acceptLanguageHeader?: string;
}): Promise<string> {
  const availableLanguages = await getAvailableLanguages();

  // 1. If user is logged in and has a language preference
  if (
    user?.preferredLanguage &&
    availableLanguages.includes(user.preferredLanguage)
  ) {
    return user.preferredLanguage;
  }

  // 2. If there is a language preference cookie
  const cookieLanguage = getLanguageFromCookie(cookieHeader);
  if (cookieLanguage && availableLanguages.includes(cookieLanguage)) {
    return cookieLanguage;
  }

  // 3. Parse Accept-Language header
  if (acceptLanguageHeader) {
    const acceptLanguage = parseAcceptLanguage(
      acceptLanguageHeader,
      availableLanguages,
    );
    if (acceptLanguage) {
      return acceptLanguage;
    }
  }

  // 4. Default to English
  return "en";
}
