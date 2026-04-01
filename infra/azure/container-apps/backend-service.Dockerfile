FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

ARG APP_DIR

COPY ${APP_DIR}/dist/ ./

RUN addgroup -S app \
  && adduser -S -G app app \
  && chown -R app:app /app

USER app

CMD ["node", "dev.js"]
