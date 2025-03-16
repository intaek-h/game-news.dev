import { HotTopicMsg } from "~/types/kv.ts";

export class MessageGuard {
  static IsHotTopic(msg: unknown): msg is HotTopicMsg {
    return Array.isArray(msg) && msg[0] === "hot-topic" &&
      typeof msg[1] ===
        "object" &&
      typeof msg[1].topic === "string" && typeof msg[1].gid ===
        "number";
  }
}
