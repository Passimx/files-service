FROM node:20.10.0-slim AS base
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

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