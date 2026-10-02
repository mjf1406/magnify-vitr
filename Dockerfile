# syntax=docker/dockerfile:1

FROM node:22-bookworm AS web-build

RUN npm install -g bun@1.3.14 \
  && apt-get update \
  && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY . .

ENV NODE_ENV=production \
    DISABLE_REACT_COMPILER=true \
    NODE_OPTIONS=--max-old-space-size=8192 \
    UV_THREADPOOL_SIZE=2

RUN node node_modules/vite-plus/bin/vp build

FROM nginx:1.27-alpine AS web

COPY docker/nginx.conf /etc/nginx/templates/default.conf.template
COPY docker/runtime-env.template.js /runtime-env.template.js
COPY docker/web-entrypoint.sh /web-entrypoint.sh
COPY --from=web-build /app/dist /usr/share/nginx/html

RUN chmod +x /web-entrypoint.sh \
  && apk add --no-cache wget

ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d \
    NGINX_ENVSUBST_FILTER=^(INSTANT_HTTPS_ORIGIN|INSTANT_WSS_ORIGIN)$

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

ENTRYPOINT ["/web-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
