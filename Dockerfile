FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000 DATA_DIR=/data
RUN mkdir -p /data && chown node:node /data
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/scripts/admin.ts ./scripts/admin.ts
COPY --from=build --chown=node:node /app/lib/db.ts /app/lib/schema.ts /app/lib/security.ts /app/lib/validation.ts ./lib/
COPY --from=build --chown=node:node /app/node_modules/zod ./node_modules/zod
USER node
EXPOSE 3000
CMD ["node", "server.js"]
