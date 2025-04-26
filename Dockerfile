FROM denoland/deno:2.2.6

RUN apt-get update && apt-get install -y ca-certificates

WORKDIR /app

COPY deno.json .

RUN deno install

COPY . .

RUN deno cache main.ts

# Environment variables required for the build step.
ARG TURSO_API_KEY
ARG TURSO_PRODUCTION_DB_URL
ARG CLAUDE_API_KEY
ARG SELF_URL
ARG BETTER_AUTH_SECRET
ARG DISCORD_LOG_CHANNEL_URL

RUN deno task build

# open port 8000 when running the container. (-p 8000:8000)
ARG PORT=8000
EXPOSE $PORT

# build the app and serve the main.ts file.
CMD ["deno", "task", "serve"]