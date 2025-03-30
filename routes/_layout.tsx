import { PageProps } from "$fresh/server.ts";
import { NavBar } from "~/components/nav-bar.tsx";

export default function Layout({ Component }: PageProps) {
  return (
    <div class="pt-10">
      <NavBar />
      <Component />
    </div>
  );
}
