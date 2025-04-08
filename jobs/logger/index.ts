import { err, ResultAsync } from "neverthrow";

export class Logg {
  static SendDiscord = (p: { title: string; message: string; description?: string; color?: string; code?: string }) => {
    const webhookUrl = Deno.env.get("DISCORD_LOG_CHANNEL_URL") ?? "";

    if (!webhookUrl) {
      return err({ err: new Error("Discord webhook URL is not set"), message: "webhookUrl not found" });
    }

    const { title, message, description, color, code } = p;

    return ResultAsync.fromPromise(
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Server Log",
          embeds: [
            {
              title: title,
              description: description,
              color: color ?? 16711680,
              fields: [
                {
                  "name": "Message",
                  "value": message,
                  "inline": false,
                },
                ...(code
                  ? [{
                    "name": "Code",
                    "value": "```javascript\n" + code + "\n```",
                    "inline": false,
                  }]
                  : []),
              ],
              footer: {
                text: "서버 로그 알림",
              },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      }),
      (err) => ({ err, message: "Failed to send Discord message" }),
    );
  };
}
