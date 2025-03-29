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
ARG INTAEK_API_KEY
ARG CLAUDE_API_KEY
ARG PERPLEXITY_API_KEY
ARG SELF_URL
ARG GOOGLE_SEARCH_ENDPOINT
ARG GOOGLE_SEARCH_API_KEY
ARG GOOGLE_SEARCH_ENGINE_ID
ARG OPENVERSE_CLIENT_ID
ARG OPENVERSE_API_KEY
ARG OPENVERSE_ENDPOINT
ARG R2_BUCKET
ARG R2_ACCOUNT_ID
ARG R2_TOKEN
ARG R2_ACCESS_KEY_ID
ARG R2_SECRET_ACCESS_KEY
ARG BETTER_AUTH_SECRET

RUN deno task build

# open port 8000 when running the container. (-p 8000:8000)
ARG PORT=8000
EXPOSE $PORT

# build the app and serve the main.ts file.
CMD ["deno", "task", "serve"]