export function NavBar() {
  return (
    <nav className="mb-20">
      <ul className="flex justify-center mx-auto space-x-4 underline-offset-4 aria-[current='page']:[&_a]:decoration-gray-300 aria-[current='page']:[&_a]:underline">
        <li>
          <a
            href={`/`}
            className="hover:underline"
          >
            ranked
          </a>
        </li>

        <li>
          <a
            href={`/new`}
            className="aria-[current='page']:decoration-gray-300 aria-[current='page']:underline hover:underline"
          >
            new
          </a>
        </li>

        <li>
          <a
            href="/more"
            className="hover:underline"
          >
            more
          </a>
        </li>
      </ul>
    </nav>
  );
}
