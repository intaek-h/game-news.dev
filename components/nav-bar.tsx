import { auth } from "~/auth.ts";

export interface Props {
  user?: typeof auth.$Infer.Session.user;
  currentLanguage: string;
  availableLanguages: { code: string; name: string }[];
}

export function NavBar(props: Props) {
  return (
    <nav className="mb-20">
      <ul className="flex justify-center mx-auto space-x-4 underline-offset-4 aria-[current='page']:[&_a]:decoration-gray-300 aria-[current='page']:[&_a]:underline">
        <li>
          <a
            href={`/${props.currentLanguage}`}
            className="aria-[current='page']:decoration-gray-300 aria-[current='page']:underline hover:underline"
          >
            now
          </a>
        </li>

        <li>
          <a
            href={`/news`}
            className="hover:underline"
          >
            news
          </a>
        </li>

        {props.user
          ? (
            <>
              <li>
                <a href="/sign-out" className="hover:underline">
                  leave
                </a>
              </li>
            </>
          )
          : (
            <li>
              <a href="/login" className="hover:underline">
                join
              </a>
            </li>
          )}

        {props.user?.type === "admin" && (
          <li>
            <a href="/admin" className="hover:underline">
              admin
            </a>
          </li>
        )}

        {
          /* <li className="ml-4">
          <LanguageSwitcher
            currentLanguage={props.currentLanguage}
            availableLanguages={props.availableLanguages}
            isLoggedIn={isLoggedIn}
          />
        </li> */
        }
      </ul>
    </nav>
  );
}
