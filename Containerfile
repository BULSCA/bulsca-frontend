FROM docker.io/library/node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
ARG VITE_PUBLIC_DATA_MODE=live
ARG VITE_WEBSITE_API_URL=/api/v1
ARG VITE_COMPETITION_API_URL=/api/v1
ARG VITE_PORTAL_URL=https://portal.bulsca.co.uk
ENV VITE_PUBLIC_DATA_MODE=${VITE_PUBLIC_DATA_MODE} \
    VITE_WEBSITE_API_URL=${VITE_WEBSITE_API_URL} \
    VITE_COMPETITION_API_URL=${VITE_COMPETITION_API_URL} \
    VITE_PORTAL_URL=${VITE_PORTAL_URL}
RUN test "$VITE_PUBLIC_DATA_MODE" = live && npm run build

FROM docker.io/nginxinc/nginx-unprivileged:1.28-alpine AS runtime
ENV PUBLIC_API_HOST=api.bulsca.co.uk \
    NGINX_ENVSUBST_FILTER="PUBLIC_API_HOST|NGINX_RESOLVERS"
COPY --chmod=0555 containers/10-resolvers.envsh /docker-entrypoint.d/10-resolvers.envsh
COPY containers/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/ /usr/share/nginx/html/
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/health/live"]
