import { User } from "better-auth";

export interface Props {
  user?: User;
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
            <li>
              <a href="/sign-out" className="text-white hover:underline">
                sign out
              </a>
            </li>
          )
          : (
            <li>
              <a href="/login" className="text-white hover:underline">
                login
              </a>
            </li>
          )}
      </ul>
    </nav>
  );
}
