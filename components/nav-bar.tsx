import { auth } from "~/auth.ts";

export interface Props {
  user?: typeof auth.$Infer.Session.user;
}

export function NavBar(props: Props) {
  return (
    <nav className="bg-[#eb2525]">
      <ul className="flex space-x-4">
        <li>
          <a href="/" className="text-white hover:underline">
            now
          </a>
        </li>
        {props.user
          ? (
            <>
              <li>
                <a href="/sign-out" className="text-white hover:underline">
                  sign out
                </a>
              </li>
              <li>
                <a href="/ko" className="text-white hover:underline">
                  /kor
                </a>
              </li>
            </>
          )
          : (
            <li>
              <a href="/login" className="text-white hover:underline">
                login
              </a>
            </li>
          )}

        {props.user?.type === "admin" && (
          <li>
            <a href="/admin" className="text-white hover:underline">
              admin
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
