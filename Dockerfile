FROM node:20.10.0-slim as base
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

FROM base as build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci || npm install
COPY . ./
RUN npm run build

FROM base
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/*.json ./
COPY --from=build /app/*.mobileconfig ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/api ./api
COPY --from=build /app/vosk-model-small-ru-0.22 ./vosk-model-small-ru-0.22
EXPOSE 6030
CMD ["node","dist/src/main"]