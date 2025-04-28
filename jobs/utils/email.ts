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

    const data = await mg.messages.create("verify.game-news.dev", {
      from: "Game-News.dev <registration@verify.game-news.dev>",
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
