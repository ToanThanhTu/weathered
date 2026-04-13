# Builder stage
FROM node:24-alpine AS builder
WORKDIR /app

RUN npm i -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json .npmrc ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

RUN pnpm install --frozen-lockfile
RUN pnpm -r build
RUN pnpm deploy --filter=@weathered/backend --prod /app/deploy

# Runner stage
FROM node:24-alpine
WORKDIR /app

COPY --from=builder /app/deploy ./

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
