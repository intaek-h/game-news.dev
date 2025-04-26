import { Embed, Webhook } from "@vermaysha/discord-webhook";
import { ResultAsync } from "neverthrow";

const webhookUrl = Deno.env.get("DISCORD_LOG_CHANNEL_URL") ?? "";

if (!webhookUrl) {
  console.error("Discord webhook URL is not set");
}

class Logg {
  private hook: Webhook;

  constructor() {
    this.hook = new Webhook(webhookUrl);
  }

  DiscordAlert = (p: { title: string; description?: string; code?: string; level?: "info" | "error" | "success" }) => {
    const embed = new Embed();

    embed.setTitle(p.title);
    embed.setFooter({ text: "서버 로그 알림" });
    embed.setTimestamp();
    embed.setColor("#1e1e1e");

    if (p.level === "error") {
      embed.setColor("#e32d2d");
    }
    if (p.level === "success") {
      embed.setColor("#2d9e2d");
    }
    if (p.description) {
      embed.setDescription(p.description);
    }
    if (p.code) {
      embed.addField({ name: "Data", value: "```plaintext\n" + p.code + "\n```" });
    }

    return ResultAsync.fromPromise(
      this.hook.addEmbed(embed).send(),
      (err) => {
        console.info("discord error", err);
        console.info("embed", embed);
        console.info("params", p);
        return ({ err, message: "Failed to send Discord message" });
      },
    );
  };
}

export const logg = new Logg();
