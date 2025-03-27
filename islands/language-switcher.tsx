import { useEffect, useState } from "preact/hooks";

interface LanguageSwitcherProps {
  currentLanguage: string;
  availableLanguages: { code: string; name: string }[];
  isLoggedIn: boolean;
}

export default function LanguageSwitcher(
  { currentLanguage, availableLanguages, isLoggedIn }: LanguageSwitcherProps,
) {
  const [selectedLang, setSelectedLang] = useState(currentLanguage);

  // Update selected language when props change
  useEffect(() => {
    setSelectedLang(currentLanguage);
  }, [currentLanguage]);

  const handleLanguageChange = async (e: Event) => {
    const select = e.target as HTMLSelectElement;
    const langCode = select.value;

    if (langCode === selectedLang) {
      return;
    }

    // If user is logged in, update their preference in database
    if (isLoggedIn) {
      try {
        const response = await fetch("/api/user/language-preference", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ languageCode: langCode }),
        });

        if (!response.ok) {
          console.error("Failed to update language preference");
        }
      } catch (error) {
        console.error("Error updating language preference:", error);
      }
    } else {
      // For non-logged in users, set a cookie directly
      try {
        // Set cookie with expiration of 1 year
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        document.cookie =
          `preferred_language=${langCode}; Path=/; Expires=${expires.toUTCString()}; SameSite=Lax`;
      } catch (error) {
        console.error("Error setting language cookie:", error);
      }
    }

    // Determine the new URL by replacing the language part
    const path = location.pathname.split("/").filter(Boolean);

    // If the first part is a language code, replace it
    if (availableLanguages.some((lang) => lang.code === path[0])) {
      path[0] = langCode;
    } else {
      // Otherwise, add the language code at the beginning
      path.unshift(langCode);
    }

    // Redirect to the new URL
    // deno-lint-ignore no-window
    window.location.href = `/${path.join("/")}${location.search}`;
  };

  return (
    <select
      value={selectedLang}
      onChange={handleLanguageChange}
      className="bg-transparent border-none outline-none hover:underline cursor-pointer"
      aria-label="Select language"
    >
      {availableLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
