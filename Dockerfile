FROM node:20.10.0-slim AS base

RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    make \
    g++ \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Устанавливаем зависимости БЕЗ --ignore-scripts, чтобы нативные модули собрались правильно
RUN npm ci
COPY . ./
RUN npm run build

FROM base
WORKDIR /app

# Копируем node_modules из build stage
COPY --from=build /app/node_modules ./node_modules

# Пересобираем нативные модули для текущей платформы
RUN npm rebuild vosk-koffi

# Копируем остальные файлы
COPY --from=build /app/*.json ./
COPY --from=build /app/*.mobileconfig ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/api ./api
COPY --from=build /app/vosk-model-small-ru-0.22 ./vosk-model-small-ru-0.22

EXPOSE 6030
CMD ["node","dist/src/main"]