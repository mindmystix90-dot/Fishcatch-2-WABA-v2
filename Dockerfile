FROM node:24-alpine AS builder

RUN apk add --no-cache git ffmpeg wget curl bash openssl

LABEL version="2.3.1" description="Fishcatch WhatsApp Gateway & AI Copilot Platform"

WORKDIR /evolution

COPY package.json package-lock.json ./

RUN npm ci --no-audit --no-fund

COPY ./tsconfig*.json ./
COPY ./tsup.config.ts ./
COPY ./vite*.ts ./
COPY ./tailwind.config.js ./
COPY ./postcss.config.js ./
COPY ./index.html ./
COPY ./src ./src
COPY ./server.ts ./
COPY ./storageService.ts ./
COPY ./runWithProvider.js ./

RUN npm run build

FROM node:24-alpine AS final

RUN apk add --no-cache tzdata ffmpeg bash openssl

ENV TZ=America/Sao_Paulo
ENV DOCKER_ENV=true
ENV NODE_ENV=production

WORKDIR /evolution

COPY --from=builder /evolution/package*.json ./
COPY --from=builder /evolution/node_modules ./node_modules
COPY --from=builder /evolution/dist ./dist
COPY --from=builder /evolution/server.ts ./server.ts
COPY --from=builder /evolution/storageService.ts ./storageService.ts
COPY --from=builder /evolution/src ./src
COPY --from=builder /evolution/runWithProvider.js ./runWithProvider.js
COPY --from=builder /evolution/tsup.config.ts ./tsup.config.ts
COPY --from=builder /evolution/tsconfig*.json ./

EXPOSE 3000

CMD ["npm", "start"]
