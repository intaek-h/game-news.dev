FROM denoland/deno:alpine-2.2.6

WORKDIR /app

COPY deno.json .

RUN deno install

COPY . .
RUN deno cache main.ts

RUN deno task build

# open port 8000 when running the container. (-p 8000:8000)
ARG PORT=8000
EXPOSE $PORT

# build the app and serve the main.ts file.
CMD ["deno", "task", "serve"]