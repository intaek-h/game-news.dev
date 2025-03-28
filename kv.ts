export const kv = {};

/**
 * Deno KV is activated in the main branch, which is deployed to Deno Deploy.
 * Deno Deploy handles Deno KV and Deno Cron natively.
 *
 * Because Deno Deploy's cold start time is too slow, I decided to use it solely for the cron job that leverages Deno KV too.
 *
 * The web server, the `main-docker` branch, is deployed to Railway as a Docker container.
 */

/*
kv.listenQueue(async (msg: unknown) => {
  if (MessageGuard.IsHotTopic(msg)) {
    const { topic, gid } = msg[1];

    // Create a unique message key based on the message content
    // This will be used to track whether this message has already been processed
    const messageKey = ["processed_message", `${topic}-${gid}`];

    // First check if we've already processed this message
    const processed = await kv.get(messageKey);
    if (processed.value !== null) {
      console.log(
        `Skipping duplicate message processing for topic: ${topic}, gid: ${gid}`,
      );
      return;
    }

    // Try to atomically mark this message as being processed
    // This will only succeed if the message hasn't been processed yet
    // Set an expiration time (7 days) for the processed message record to prevent unlimited storage growth
    const expirationMs = 1000 * 60 * 60 * 24 * 7; // 7 days in milliseconds
    const result = await kv.atomic()
      .check({ key: messageKey, versionstamp: null }) // Only succeed if key doesn't exist
      .set(messageKey, true, { expireIn: expirationMs }) // Mark as processed with expiration
      .commit();

    // If transaction failed, another instance already started processing this message
    if (!result.ok) {
      console.log(
        `Another instance is already processing topic: ${topic}, gid: ${gid}`,
      );
      return;
    }

    try {
      console.log(`Processing topic: ${topic}, gid: ${gid}`);

      const writeResult = await ArticleCompound.WriteArticles({ topic, gid });

      console.log("WriteArticles result: ", writeResult);
    } catch (error) {
      console.error(`Error processing topic ${topic}:`, error);
      // In case of an unrecoverable error, we still keep the message marked as processed
      // to prevent infinite retry loops. The key will be automatically removed after expiration.
    }
  }
});
*/
