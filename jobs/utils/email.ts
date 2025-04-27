import Mailgun from "mailgun.js";
import FormData from "form-data";
import { ResultAsync } from "neverthrow";

export function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const send = async () => {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: "api",
      key: Deno.env.get("MAILGUN_API_KEY") ?? "",
    });

    // TODO: change to production domain. this is a sandbox domain for development.
    const data = await mg.messages.create("sandbox36192e46c3244c93ad95b457904f255a.mailgun.org", {
      from: "Mailgun Sandbox <postmaster@sandbox36192e46c3244c93ad95b457904f255a.mailgun.org>",
      to: [to],
      subject,
      text,
    });

    console.log(data);

    return data;
  };

  return ResultAsync.fromPromise(send(), (err) => {
    console.error(err);
    return { err, message: "Failed to send email" };
  });
}
