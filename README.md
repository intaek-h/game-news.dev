# Game News

This website aggregates daily hot topics in the gaming world.

# Roadmap

Here are the list of works to do. The list is not ordered.

- [ ] Implement email+password auth using BetterAuth.
- [ ] Separate admin user and ordinary user and restrict access
- [x] Store thumbnail images to Cloudflare R2
- [x] Implement Cloudflare Worker for on-demand image transformation and CDN
      caching of images

# Run

```
deno task start
```

# Tech

- Deno 2.0+
- Fresh
- Turso(libsql)
- Drizzle ORM
