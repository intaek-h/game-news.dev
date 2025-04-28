import { useCSP } from "$fresh/runtime.ts";

export function defaultCSP() {
  // deno-lint-ignore react-rules-of-hooks
  useCSP((csp) => {
    csp.directives.defaultSrc = ["self"];

    if (!csp.directives.fontSrc) {
      csp.directives.fontSrc = [];
    }
    csp.directives.fontSrc.push("'self'");
    csp.directives.fontSrc.push("https://fonts.gstatic.com");
    csp.directives.fontSrc.push("https://fonts.googleapis.com");

    if (!csp.directives.styleSrc) {
      csp.directives.styleSrc = [];
    }
    csp.directives.styleSrc.push(`${Deno.env.get("SELF_URL")}/styles.css`);
    csp.directives.styleSrc.push("https://fonts.googleapis.com");

    if (!csp.directives.scriptSrc) {
      csp.directives.scriptSrc = [];
    }
    csp.directives.scriptSrc.push("'strict-dynamic'");

    if (!csp.directives.imgSrc) {
      csp.directives.imgSrc = [];
    }
    csp.directives.imgSrc.push("'self'");
  });
}
