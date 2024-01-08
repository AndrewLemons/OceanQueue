FROM node:20-slim AS base

#########
# Setup #
#########

# Install git
RUN apt-get -y update
RUN apt-get -y install git

# Install PNPM
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy project files
COPY . /app
WORKDIR /app

###########################
# Production dependencies #
###########################

FROM base AS prod-deps

# Install production dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

#########
# Build #
#########

FROM base AS build

# Install all dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Run builds
RUN pnpm run build:client
RUN pnpm run build:server

########
# Base #
########

FROM base

# Copy production dependencies and build artifacts
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist-client /app/dist-client
COPY --from=build /app/dist-server /app/dist-server

#######
# Run #
#######

EXPOSE 5000
CMD [ "pnpm", "start" ]