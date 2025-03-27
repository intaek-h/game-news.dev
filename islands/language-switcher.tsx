// filepath: /Users/ahiou/Documents/repositories/extinguish-backend/islands/language-switcher.tsx
import { useEffect, useState } from "preact/hooks";

interface LanguageSwitcherProps {
  currentLanguage: string;
  availableLanguages: { code: string; name: string }[];
  isLoggedIn: boolean;
}

export default function LanguageSwitcher(
  { currentLanguage, availableLanguages, isLoggedIn }: LanguageSwitcherProps,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(currentLanguage);

  // Update selected language when props change
  useEffect(() => {
    setSelectedLang(currentLanguage);
  }, [currentLanguage]);

  const switchLanguage = async (langCode: string) => {
    if (langCode === selectedLang) {
      setIsOpen(false);
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

  // Find language name for currently selected language
  const currentLangName =
    availableLanguages.find((lang) => lang.code === selectedLang)?.name ||
    selectedLang;

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center items-center w-full rounded-md px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded="true"
          aria-haspopup="true"
        >
          <span className="mr-1">{currentLangName}</span>
          <svg
            className="-mr-1 ml-1 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          <div className="py-1" role="none">
            {availableLanguages.map((lang) => (
              <button
                type="button"
                key={lang.code}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  selectedLang === lang.code
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                role="menuitem"
                onClick={() => switchLanguage(lang.code)}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
