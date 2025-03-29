# Notice

This is a `main-docker` branch. This branch is specifically developed to be
deployed as a docker container. It does not utilize the DenoKV and Deno Cron
feature which is necessary for the service to gather news information on a daily
basis. It is because DenoKV and cron is currently only natively supported by
Deno Deploy, the serverless hosting platform. All the related codes are
commented out (see kv.ts).

Currently, this branch is deployed to Railway.com. The `main` branch, which
utilizes the DenoKV and etc, is deployed to Deno Deploy just for those limited
features.

To summarize, `main` branch is for the cron jobs only. `main-docker` branch is
for the rest of the service.

# Game News

This website aggregates daily hot topics in the gaming world.

# Roadmap

Here are the list of works to do. The list is not ordered.

- [x] Implement email+password auth using BetterAuth.
- [x] Separate admin user and ordinary user and restrict access
- [x] Store thumbnail images to Cloudflare R2
- [x] Implement Cloudflare Worker for on-demand image transformation and CDN
      caching of images

# Local Development

```
deno task docker:dev
```

# Tech

- Deno 2.0+
- Fresh
- Turso(libsql)
- Drizzle ORM
