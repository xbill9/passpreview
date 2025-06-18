# Dockerfile

# ---- Base ----
# Base image for installing dependencies and building the application
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- Dependencies ----
# Install dependencies using pnpm
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
# Ensure pnpm uses the store from the cache mount
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod=false

# ---- Builder ----
# Build the Next.js application
FROM base AS builder
# Copy installed dependencies
COPY --from=deps /app/node_modules /app/node_modules
# Copy the rest of the application code
COPY . .
# Build the application
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm build

# ---- Runner ----
# Production image, copy only the standalone output
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Create a non-root user and group for security
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy the standalone Next.js application output
# Ensure correct ownership for the non-root user
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
# Copy the static assets from the public folder
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
# Copy the static assets from the .next/static folder (served by Next.js)
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

# Set the user to the non-root user
USER nextjs

# Expose the port the app runs on. Default for Next.js is 3000.
EXPOSE 3000
# Set PORT environment variable, which server.js in standalone mode will use.
ENV PORT 3000

# Start the Next.js application (Node.js server from standalone output)
# This command refers to server.js inside the .next/standalone directory.
CMD ["node", "server.js"]