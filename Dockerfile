# Dockerfile for Next.js application

# 1. Builder stage: Install dependencies and build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package.json package-lock.json* ./

# Install dependencies using npm ci for reproducible builds
# Ensure you have a package-lock.json for this to work reliably
RUN npm ci --prefer-offline --no-audit

# Copy the rest of the application source code
COPY . .

# Disable Next.js telemetry during the build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
# The `next.config.js` should have `output: 'standalone'`
RUN npm run build

# 2. Runner stage: Create a minimal image to run the application
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Disable Next.js telemetry in the production image as well
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user and group for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage
# This includes the server.js file, .next/server, and node_modules for the standalone app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy the public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy the static Next.js assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to the non-root user
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Set the default port environment variable (Next.js will use this)
ENV PORT 3000

# Command to run the Next.js server in standalone mode
CMD ["node", "server.js"]
