FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

ARG APP_DIR

COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY ${APP_DIR}/dist/package.json ./package.json

RUN corepack enable \
  && pnpm install --prod --frozen-lockfile --ignore-workspace

COPY ${APP_DIR}/dist/ ./

RUN addgroup -S app \
  && adduser -S -G app app \
  && chown -R app:app /app

USER app

CMD ["node", "dev.js"]
