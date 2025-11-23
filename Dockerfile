FROM node:20.10.0-slim AS base
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

RUN npm run build

FROM base
WORKDIR /app

# Устанавливаем системные библиотеки для vosk-koffi
# libc6 и libstdc++6 уже включены в base, но убеждаемся что они есть
RUN apt-get update && apt-get install -y \
    libc6 \
    libstdc++6 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/*.json ./
COPY --from=build /app/*.mobileconfig ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/api ./api
COPY --from=build /app/vosk-model-small-ru-0.22 ./vosk-model-small-ru-0.22

EXPOSE 6030
CMD ["node","dist/src/main"]