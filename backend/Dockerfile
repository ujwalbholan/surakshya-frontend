# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.18.1
ARG PNPM_VERSION=10.20.0

FROM node:${NODE_VERSION}-slim AS dependencies

ARG PNPM_VERSION

WORKDIR /app

RUN npm install --global pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml ./

ENV HUSKY=0

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts \
    && pnpm rebuild bcrypt

FROM dependencies AS build

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

ENV HUSKY=0

RUN pnpm run build

RUN pnpm prune --prod

FROM node:${NODE_VERSION}-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
